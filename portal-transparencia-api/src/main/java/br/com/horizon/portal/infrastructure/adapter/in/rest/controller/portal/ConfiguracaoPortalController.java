package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.application.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/api/v1/portal/configuracoes")
@RequiredArgsConstructor
public class ConfiguracaoPortalController {

    private final ConfiguracaoService service;

    @GetMapping
    public ResponseEntity<ConfiguracaoDTO.Response> obterConfiguracaoPortal() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @GetMapping("/brasao")
    public ResponseEntity<Resource> servirBrasao() {
        String path = System.getProperty("user.dir") + File.separator + "Imagens";
        File folder = new File(path);
        
        if (!folder.exists()) {
            return ResponseEntity.notFound().build();
        }

        // Busca o arquivo que começa com "brasao"
        File[] files = folder.listFiles((dir, name) -> name.startsWith("brasao"));
        
        if (files != null && files.length > 0) {
            File arquivoImagem = files[0];
            String nomeArquivo = arquivoImagem.getName().toLowerCase();
            
            // Tipagem Dinâmica para evitar bloqueios de MIME type
            MediaType mediaType = MediaType.IMAGE_PNG; 
            if (nomeArquivo.endsWith(".jpg") || nomeArquivo.endsWith(".jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;
            } else if (nomeArquivo.endsWith(".svg")) {
                mediaType = MediaType.valueOf("image/svg+xml");
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, mediaType.toString())
                    .body(new FileSystemResource(arquivoImagem));
        }
        
        return ResponseEntity.notFound().build();
    }
}