package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.service.PortalService;
import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal")
@RequiredArgsConstructor
public class PortalController {

    private final ReceitaRepository receitaRepository;
    private final PortalService portalService;

    public record ReceitaPublicaDTO(
            Integer exercicio, Integer mes, LocalDate dataLancamento,
            String categoriaEconomica, String origem, String especie,
            String rubrica, String alinea, String fonteRecursos,
            BigDecimal valorPrevistoInicial, BigDecimal valorPrevistoAtualizado,
            BigDecimal valorArrecadado, String historico
    ) {
        public static ReceitaPublicaDTO fromEntity(ReceitaEntity entity) {
            return new ReceitaPublicaDTO(
                    entity.getExercicio(), entity.getMes(), entity.getDataLancamento(),
                    entity.getCategoriaEconomica(), entity.getOrigem(), entity.getEspecie(),
                    entity.getRubrica(), entity.getAlinea(), entity.getFonteRecursos(),
                    entity.getValorPrevistoInicial(), entity.getValorPrevistoAtualizado(),
                    entity.getValorArrecadado(), entity.getHistorico()
            );
        }
    }

    @GetMapping("/receitas")
    public ResponseEntity<Page<ReceitaPublicaDTO>> listarReceitasPublicas(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String fonte,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @PageableDefault(size = 20, sort = {"dataLancamento"}) Pageable pageable) {

        Specification<ReceitaEntity> spec = portalService.criarSpecificationReceita(exercicio, origem, categoria, fonte, dataInicio, dataFim);
        Page<ReceitaPublicaDTO> page = receitaRepository.findAll(spec, pageable).map(ReceitaPublicaDTO::fromEntity);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/receitas/resumo")
    public ResponseEntity<Map<String, Object>> obterResumoPublico(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String fonte,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        Specification<ReceitaEntity> spec = portalService.criarSpecificationReceita(exercicio, origem, categoria, fonte, dataInicio, dataFim);

        long totalRegistros = receitaRepository.count(spec);
        List<ReceitaEntity> filtrados = receitaRepository.findAll(spec);
        BigDecimal totalArrecadado = filtrados.stream()
                .map(ReceitaEntity::getValorArrecadado)
                .filter(valor -> valor != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("totalArrecadado", totalArrecadado);
        resumo.put("totalRegistros", totalRegistros);
        resumo.put("serieHistoricaDisponivel", true); 

        return ResponseEntity.ok(resumo);
    }

    @GetMapping("/receitas/exportar")
    public void exportarReceitas(
            @RequestParam(name = "exercicio", required = false) Integer exercicio,
            @RequestParam(name = "origem", required = false) String origem,
            @RequestParam(name = "categoria", required = false) String categoria,
            @RequestParam(name = "fonte", required = false) String fonte,
            @RequestParam(name = "dataInicio", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(name = "dataFim", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(name = "formato", required = false, defaultValue = "csv") String formato,
            HttpServletResponse response) throws Exception {

        Specification<ReceitaEntity> spec = portalService.criarSpecificationReceita(exercicio, origem, categoria, fonte, dataInicio, dataFim);

        if ("pdf".equalsIgnoreCase(formato)) {
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=\"receitas_transparencia.pdf\"");
            portalService.gerarPdfReceitas(spec, response);
        } else {
            response.setContentType("text/csv");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Disposition", "attachment; filename=\"receitas_transparencia.csv\"");
            portalService.gerarCsvReceitas(spec, response.getWriter());
        }
    }
}



