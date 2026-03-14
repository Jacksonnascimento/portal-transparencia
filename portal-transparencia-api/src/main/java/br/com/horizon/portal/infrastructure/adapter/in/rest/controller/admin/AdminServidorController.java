package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.servidor.ServidorAdminDTO;
import br.com.horizon.portal.application.service.ServidorService;
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
@RequestMapping("/api/v1/servidores")
@RequiredArgsConstructor
public class AdminServidorController {

    private final ServidorService servidorService;

    @GetMapping
    public ResponseEntity<Page<ServidorAdminDTO>> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) String lotacao,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ServidorAdminDTO> pagina = servidorService.listarAdmin(nome, cargo, lotacao, pageable);
        return ResponseEntity.ok(pagina);
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) String lotacao) {
        
        byte[] data = servidorService.exportarAdminCsv(nome, cargo, lotacao);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=servidores_admin.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) String lotacao) {
        
        byte[] data = servidorService.exportarAdminPdf(nome, cargo, lotacao);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=servidores_admin.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @PostMapping("/importar")
    public ResponseEntity<Map<String, String>> importarCsv(@RequestParam("file") MultipartFile file) {
        String idImportacao = servidorService.importarServidoresCsv(file);
        
        return ResponseEntity.ok(Map.of(
                "mensagem", "Importação realizada com sucesso",
                "idImportacao", idImportacao
        ));
    }

    @DeleteMapping("/importacao/{idImportacao}")
    public ResponseEntity<Void> desfazerImportacao(@PathVariable String idImportacao) {
        servidorService.desfazerImportacao(idImportacao);
        return ResponseEntity.noContent().build();
    }
}