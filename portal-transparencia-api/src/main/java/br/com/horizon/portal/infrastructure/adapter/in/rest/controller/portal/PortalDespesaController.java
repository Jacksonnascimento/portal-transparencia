package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.service.PortalDespesaService;
import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
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

    // --- DTO: PADRÃO DE SEGURANÇA PARA EXPOSIÇÃO PÚBLICA ---
    public record DespesaPublicaDTO(
            Integer exercicio,
            String numeroEmpenho,
            LocalDate dataEmpenho,
            String orgaoNome,
            String credorNome,
            String credorDocumento,
            String elementoDespesa,
            BigDecimal valorEmpenhado,
            BigDecimal valorLiquidado,
            BigDecimal valorPago
    ) {
        public static DespesaPublicaDTO fromEntity(DespesaEntity entity) {
            String credorNome = entity.getCredor() != null ? entity.getCredor().getRazaoSocial() : "NÃO INFORMADO";
            String doc = entity.getCredor() != null ? entity.getCredor().getCpfCnpj() : "";
            
            // Mascara CPF para LGPD, mas deixa CNPJ visível (Pessoa Jurídica não tem sigilo em despesa pública)
            if (doc.length() == 11) {
                doc = "***." + doc.substring(3, 6) + ".***-**";
            }

            return new DespesaPublicaDTO(
                    entity.getExercicio(),
                    entity.getNumeroEmpenho(),
                    entity.getDataEmpenho(),
                    entity.getOrgaoNome(),
                    credorNome,
                    doc,
                    entity.getElementoDespesa(),
                    entity.getValorEmpenhado() != null ? entity.getValorEmpenhado() : BigDecimal.ZERO,
                    entity.getValorLiquidado() != null ? entity.getValorLiquidado() : BigDecimal.ZERO,
                    entity.getValorPago() != null ? entity.getValorPago() : BigDecimal.ZERO
            );
        }
    }

    // --- 1. LISTAGEM PRINCIPAL COM FILTROS (Consumida pelo seu Sócio) ---
    @GetMapping
    public ResponseEntity<Page<DespesaPublicaDTO>> listarDespesasPublicas(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String credor,
            @RequestParam(required = false) String numeroEmpenho,
            @RequestParam(required = false) String elementoDespesa,
            @PageableDefault(size = 20, sort = {"dataEmpenho", "numeroEmpenho"}) Pageable pageable) {

        Specification<DespesaEntity> spec = portalDespesaService.criarSpecificationDespesa(ano, credor, numeroEmpenho, elementoDespesa);
        
        Page<DespesaPublicaDTO> page = despesaRepository.findAll(spec, pageable)
                .map(DespesaPublicaDTO::fromEntity); // Converte a Entidade para o DTO limpo
                
        return ResponseEntity.ok(page);
    }

    // --- 2. CARDS DE RESUMO PÚBLICOS (Selo Ouro) ---
    @GetMapping("/resumo")
    public ResponseEntity<Map<String, BigDecimal>> obterResumoPorAno(@RequestParam Integer ano) {
        return ResponseEntity.ok(Map.of(
                "valorEmpenhado", despesaRepository.sumTotalEmpenhadoPorAno(ano),
                "valorLiquidado", despesaRepository.sumTotalLiquidadoPorAno(ano),
                "valorPago", despesaRepository.sumTotalPagoPorAno(ano)
        ));
    }

    // --- 3. ANOS DISPONÍVEIS (Para o select do cidadão) ---
    @GetMapping("/anos")
    public ResponseEntity<Iterable<Integer>> listarAnos() {
        return ResponseEntity.ok(despesaRepository.findAnosDisponiveis());
    }

    // --- 4. EXPORTAÇÃO DE DADOS ABERTOS (CSV) ---
    @GetMapping("/exportar")
    public void exportarDespesas(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String credor,
            @RequestParam(required = false) String numeroEmpenho,
            @RequestParam(required = false) String elementoDespesa,
            @RequestParam(name = "formato", required = false, defaultValue = "csv") String formato,
            HttpServletResponse response) throws Exception {

        Specification<DespesaEntity> spec = portalDespesaService.criarSpecificationDespesa(ano, credor, numeroEmpenho, elementoDespesa);

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