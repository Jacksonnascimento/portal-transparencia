package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.despesa.DespesaPublicaDTO;
import br.com.horizon.portal.application.service.PortalDespesaService;
import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal/despesas") // ROTA PÚBLICA (Vitrine do Cidadão)
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PortalDespesaController {

    private final DespesaRepository despesaRepository;
    private final PortalDespesaService portalDespesaService;

    // --- 1. LISTAGEM PRINCIPAL (AGORA COM 8 FILTROS TÉCNICOS) ---
    @GetMapping
    public ResponseEntity<Page<DespesaPublicaDTO>> listarDespesasPublicas(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String credor,
            @RequestParam(required = false) String numeroEmpenho,
            @RequestParam(required = false) String numeroProcesso, // NOVO
            @RequestParam(required = false) String acaoGoverno,    // NOVO
            @RequestParam(required = false) String elementoDespesa,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @PageableDefault(size = 20, sort = {"dataEmpenho", "numeroEmpenho"}) Pageable pageable) {

        // Chamada atualizada com os novos campos para a Specification
        Specification<DespesaEntity> spec = portalDespesaService.criarSpecificationDespesa(
                ano, credor, numeroEmpenho, numeroProcesso, acaoGoverno, elementoDespesa, dataInicio, dataFim);
        
        Page<DespesaPublicaDTO> page = despesaRepository.findAll(spec, pageable)
                .map(DespesaPublicaDTO::fromEntity);
                
        return ResponseEntity.ok(page);
    }

    // --- 2. CARDS DE RESUMO (ANO OPCIONAL PARA O DASHBOARD) ---
    @GetMapping("/resumo")
    public ResponseEntity<Map<String, BigDecimal>> obterResumoPorAno(@RequestParam(required = false) Integer ano) {
        BigDecimal empenhado = despesaRepository.sumTotalEmpenhadoPorAno(ano);
        BigDecimal liquidado = despesaRepository.sumTotalLiquidadoPorAno(ano);
        BigDecimal pago = despesaRepository.sumTotalPagoPorAno(ano);

        return ResponseEntity.ok(Map.of(
                "valorEmpenhado", empenhado != null ? empenhado : BigDecimal.ZERO,
                "valorLiquidado", liquidado != null ? liquidado : BigDecimal.ZERO,
                "valorPago", pago != null ? pago : BigDecimal.ZERO
        ));
    }

    // --- 3. ANOS DISPONÍVEIS ---
    @GetMapping("/anos")
    public ResponseEntity<Iterable<Integer>> listarAnos() {
        return ResponseEntity.ok(despesaRepository.findAnosDisponiveis());
    }

    // --- 4. EXPORTAÇÃO (SINCROZINADA COM OS NOVOS FILTROS) ---
    @GetMapping("/exportar")
    public void exportarDespesas(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String credor,
            @RequestParam(required = false) String numeroEmpenho,
            @RequestParam(required = false) String numeroProcesso, // NOVO
            @RequestParam(required = false) String acaoGoverno,    // NOVO
            @RequestParam(required = false) String elementoDespesa,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(name = "formato", required = false, defaultValue = "csv") String formato,
            HttpServletResponse response) throws Exception {

        Specification<DespesaEntity> spec = portalDespesaService.criarSpecificationDespesa(
                ano, credor, numeroEmpenho, numeroProcesso, acaoGoverno, elementoDespesa, dataInicio, dataFim);

        if ("pdf".equalsIgnoreCase(formato)) {
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=\"despesas_publicas.pdf\"");
            portalDespesaService.gerarPdfDespesa(spec, response);
        } else {
            response.setContentType("text/csv");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Disposition", "attachment; filename=\"despesas_publicas.csv\"");
            portalDespesaService.gerarCsvDespesa(spec, response.getWriter());
        }
    }
}