package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.folhapagamento.FolhaEstatisticaDTO;
import br.com.horizon.portal.application.dto.folhapagamento.FolhaPagamentoAdminDTO;
import br.com.horizon.portal.application.service.FolhaPagamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/folha-pagamento")
@RequiredArgsConstructor
public class AdminFolhaPagamentoController {

    private final FolhaPagamentoService folhaPagamentoService;

    @GetMapping
    public ResponseEntity<Page<FolhaPagamentoAdminDTO>> listar(
            @RequestParam(required = false) String nomeServidor,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<FolhaPagamentoAdminDTO> pagina = folhaPagamentoService.listarAdmin(nomeServidor, exercicio, mes, pageable);
        return ResponseEntity.ok(pagina);
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<FolhaEstatisticaDTO> obterEstatisticas(
            @RequestParam Integer exercicio,
            @RequestParam Integer mes) {
        
        FolhaEstatisticaDTO estatisticas = folhaPagamentoService.obterEstatistica(exercicio, mes);
        return ResponseEntity.ok(estatisticas);
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) String nomeServidor,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes) {
        
        byte[] data = folhaPagamentoService.exportarAdminCsv(nomeServidor, exercicio, mes);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=folha_admin_completa.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(required = false) String nomeServidor,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes) {
        
        byte[] data = folhaPagamentoService.exportarAdminPdf(nomeServidor, exercicio, mes);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=folha_admin_completa.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @PostMapping("/importar")
    public ResponseEntity<Map<String, String>> importarCsv(@RequestParam("file") MultipartFile file) {
        String idImportacao = folhaPagamentoService.importarFolhaCsv(file);
        
        return ResponseEntity.ok(Map.of(
                "mensagem", "Folha de pagamento importada com sucesso",
                "idImportacao", idImportacao
        ));
    }

    @DeleteMapping("/importacao/{idImportacao}")
    public ResponseEntity<Void> desfazerImportacao(@PathVariable String idImportacao) {
        folhaPagamentoService.desfazerImportacao(idImportacao);
        return ResponseEntity.noContent().build();
    }
}