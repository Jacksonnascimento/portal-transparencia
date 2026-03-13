package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.service.DespesaService;
import br.com.horizon.portal.application.service.PortalDespesaService;
import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/despesas") // ROTA PRIVADA ADMIN
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DespesaController {

    private final DespesaRepository repository;
    private final DespesaService service;
    
    // Injetamos o Service do Portal para reaproveitar a fábrica de filtros (Specification)
    private final PortalDespesaService searchService; 

    // --- 1. LISTAGEM COM FILTROS (PAGINADA) ---
    @GetMapping
    public ResponseEntity<Page<DespesaEntity>> listarAdmin(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String credor,
            @RequestParam(required = false) String numeroEmpenho,
            @RequestParam(required = false) String elementoDespesa,
            @PageableDefault(size = 20, sort = "dataEmpenho") Pageable pageable) {

        Specification<DespesaEntity> spec = searchService.criarSpecificationDespesa(ano, credor, numeroEmpenho, elementoDespesa);
        return ResponseEntity.ok(repository.findAll(spec, pageable));
    }

    // --- 2. FILTRO INTELIGENTE DE ANOS ---
    @GetMapping("/anos")
    public ResponseEntity<List<Integer>> listarAnosDisponiveis() {
        return ResponseEntity.ok(repository.findAnosDisponiveis());
    }

    // --- 3. DADOS PARA OS CARDS DE RESUMO (Selo Ouro) ---
    @GetMapping("/resumo")
    public ResponseEntity<Map<String, BigDecimal>> obterResumoPorAno(@RequestParam Integer ano) {
        BigDecimal empenhado = repository.sumTotalEmpenhadoPorAno(ano);
        BigDecimal liquidado = repository.sumTotalLiquidadoPorAno(ano);
        BigDecimal pago = repository.sumTotalPagoPorAno(ano);

        return ResponseEntity.ok(Map.of(
                "valorEmpenhado", empenhado,
                "valorLiquidado", liquidado,
                "valorPago", pago
        ));
    }

    // --- 4. INGESTÃO MASSIVA (Via tela de Importação) ---
    @PostMapping("/upload")
    public ResponseEntity<String> importarCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("Arquivo vazio!");
        service.importarArquivoCsv(file);
        return ResponseEntity.ok("Arquivo de Despesas processado com sucesso!");
    }

    // --- 5. ROLLBACK DE LOTE ---
    @DeleteMapping("/lote/{loteId}")
    public ResponseEntity<String> excluirLote(@PathVariable String loteId) {
        service.excluirLote(loteId);
        return ResponseEntity.ok("Lote " + loteId + " excluído com sucesso!");
    }
}