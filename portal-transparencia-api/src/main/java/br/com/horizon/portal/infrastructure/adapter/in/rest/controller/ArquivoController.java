package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.service.ArmazenamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal/arquivos")
@RequiredArgsConstructor
public class ArquivoController {

    private final ArmazenamentoService armazenamentoService;

    // Rota que o Front-end chama para fazer o UPLOAD
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadArquivo(@RequestParam("file") MultipartFile file) {
        String urlArquivo = armazenamentoService.salvar(file);
        // Retornamos um JSON com a URL gerada para o Front-end usar no DTO do e-SIC
        return ResponseEntity.ok(Map.of("url", urlArquivo));
    }

    // Rota que o Front-end chama para LER/BAIXAR o arquivo
    @GetMapping("/{nomeArquivo:.+}")
    @ResponseBody
    public ResponseEntity<Resource> baixarArquivo(@PathVariable String nomeArquivo) {
        Resource file = armazenamentoService.carregar(nomeArquivo);
        
        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(file.getFile().toPath());
        } catch (IOException ex) {
            // Se não descobrir o tipo, usa o padrão de download
        }

        // O "inline" tenta abrir o PDF no navegador. Se fosse "attachment", forçaria o download direto.
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }
}