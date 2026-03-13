package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.divida.DividaAtivaAdminDTO;
import br.com.horizon.portal.application.service.DividaAtivaService;
import br.com.horizon.portal.application.service.PortalDividaAtivaService;
import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DividaAtivaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/divida-ativa") // ROTA PRIVADA
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DividaAtivaController {

    private final DividaAtivaRepository repository;
    private final DividaAtivaService service;
    private final PortalDividaAtivaService searchService; // Reaproveitamos a lógica de busca do Portal

    // --- LISTAGEM BLINDADA PELO DTO ---
    @GetMapping
    public ResponseEntity<Page<DividaAtivaAdminDTO>> listarAdmin(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String tipoDivida,
            @PageableDefault(size = 20, sort = "anoInscricao") Pageable pageable) {

        Specification<DividaAtivaEntity> spec = searchService.criarSpecificationDivida(nome, ano, tipoDivida);
        
        // Converte a Entidade para o DTO do Admin
        Page<DividaAtivaAdminDTO> page = repository.findAll(spec, pageable).map(DividaAtivaAdminDTO::fromEntity);
        
        return ResponseEntity.ok(page);
    }

    @GetMapping("/anos")
    public ResponseEntity<List<Integer>> listarAnosDisponiveis() {
        return ResponseEntity.ok(service.listarAnosDisponiveis());
    }

    @PostMapping("/upload")
    public ResponseEntity<String> importarCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("Arquivo vazio!");
        service.importarArquivoCsv(file);
        return ResponseEntity.ok("Arquivo de Dívida Ativa processado com sucesso!");
    }

    @DeleteMapping("/lote/{loteId}")
    public ResponseEntity<String> excluirLote(@PathVariable String loteId) {
        service.excluirLote(loteId);
        return ResponseEntity.ok("Lote " + loteId + " excluído com sucesso!");
    }
}