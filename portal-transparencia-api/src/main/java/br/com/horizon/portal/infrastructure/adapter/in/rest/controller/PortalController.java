package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal")
@RequiredArgsConstructor
public class PortalController {

    private final ReceitaRepository receitaRepository;

    /**
     * DTO Público - Oculta IDs internos e dados de auditoria da Retaguarda.
     */
    public record ReceitaPublicaDTO(
            Integer exercicio,
            Integer mes,
            LocalDate dataLancamento,
            String categoriaEconomica,
            String origem,
            String fonteRecursos,
            BigDecimal valorArrecadado,
            String historico
    ) {
        public static ReceitaPublicaDTO fromEntity(ReceitaEntity entity) {
            return new ReceitaPublicaDTO(
                    entity.getExercicio(),
                    entity.getMes(),
                    entity.getDataLancamento(),
                    entity.getCategoriaEconomica(),
                    entity.getOrigem(),
                    entity.getFonteRecursos(),
                    entity.getValorArrecadado(),
                    entity.getHistorico()
            );
        }
    }

    /**
     * ENDPOINT 1: Listagem Pública de Receitas
     * Rota: GET /api/v1/portal/receitas?page=0&size=20
     */
    @GetMapping("/receitas")
    public ResponseEntity<Page<ReceitaPublicaDTO>> listarReceitasPublicas(
            @PageableDefault(size = 20, sort = {"dataLancamento"}) Pageable pageable) {
        
        Page<ReceitaPublicaDTO> page = receitaRepository.findAll(pageable)
                .map(ReceitaPublicaDTO::fromEntity);
                
        return ResponseEntity.ok(page);
    }

    /**
     * ENDPOINT 2: Resumo para Dashboard (KPIs do Portal)
     * Rota: GET /api/v1/portal/receitas/resumo?ano=2024
     */
    @GetMapping("/receitas/resumo")
    public ResponseEntity<Map<String, Object>> obterResumoPublico(
            @RequestParam(name = "ano", required = false) Integer ano) {
        
        int anoFiltro = (ano != null) ? ano : LocalDate.now().getYear();

        // REVISÃO: Usando o seu método original já existente no repositório!
        BigDecimal totalArrecadado = receitaRepository.totalArrecadadoPorAno(anoFiltro);

        // O Banco apenas conta as linhas
        long totalLancamentos = receitaRepository.countByExercicio(anoFiltro);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("anoReferencia", anoFiltro);
        resumo.put("totalArrecadado", totalArrecadado);
        resumo.put("totalLancamentos", totalLancamentos);

        return ResponseEntity.ok(resumo);
    }
}