package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.servidor.ServidorPublicoDTO;
import br.com.horizon.portal.application.service.ServidorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/servidores")
@RequiredArgsConstructor
public class PortalServidorController {

    private final ServidorService servidorService;

    @GetMapping
    public ResponseEntity<Page<ServidorPublicoDTO>> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) String lotacao,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ServidorPublicoDTO> pagina = servidorService.listarPublico(nome, cargo, lotacao, pageable);
        return ResponseEntity.ok(pagina);
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) String lotacao) {
        
        byte[] data = servidorService.exportarPublicoCsv(nome, cargo, lotacao);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=servidores_portal.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) String lotacao) {
        
        byte[] data = servidorService.exportarPublicoPdf(nome, cargo, lotacao);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=servidores_portal.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}