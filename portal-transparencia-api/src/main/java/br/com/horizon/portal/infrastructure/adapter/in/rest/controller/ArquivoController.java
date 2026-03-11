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
    // Permite agora especificar uma subpasta, caso contrário usa "geral" (retrocompatibilidade)
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadArquivo(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subpasta", defaultValue = "geral") String subpasta) {
        
        String urlArquivo = armazenamentoService.salvar(file, subpasta);
        return ResponseEntity.ok(Map.of("url", urlArquivo));
    }

    // Rota NOVA que o Front-end chama para LER/BAIXAR o arquivo com subpasta explícita
    @GetMapping("/{subPasta}/{nomeArquivo:.+}")
    @ResponseBody
    public ResponseEntity<Resource> baixarArquivoComSubpasta(@PathVariable String subPasta, @PathVariable String nomeArquivo) {
        Resource file = armazenamentoService.carregar(subPasta, nomeArquivo);
        return construirRespostaDownload(file);
    }

    // Rota ANTIGA (Fallback). Garante que arquivos já salvos no BD no formato antigo não quebrem
    @GetMapping("/{nomeArquivo:.+}")
    @ResponseBody
    public ResponseEntity<Resource> baixarArquivoAntigo(@PathVariable String nomeArquivo) {
        Resource file = armazenamentoService.carregar("geral", nomeArquivo);
        return construirRespostaDownload(file);
    }

    // Método privado auxiliar para manter o código DRY (Don't Repeat Yourself)
    private ResponseEntity<Resource> construirRespostaDownload(Resource file) {
        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(file.getFile().toPath());
        } catch (IOException ex) {
            // Se não descobrir o tipo, usa o padrão de download
        }

        // O "inline" tenta abrir o PDF/imagem no navegador. Se fosse "attachment", forçaria o download direto.
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }
}