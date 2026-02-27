package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.application.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ConfiguracaoController {

    private final ConfiguracaoService service;

    // --- ENDPOINTS PRIVADOS (Para o Retaguarda) ---

    @GetMapping("/configuracoes")
    public ResponseEntity<ConfiguracaoDTO.Response> obterParaAdmin() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @PutMapping("/configuracoes")
    public ResponseEntity<ConfiguracaoDTO.Response> atualizar(@RequestBody ConfiguracaoDTO.Update dto) {
        return ResponseEntity.ok(service.atualizar(dto));
    }

    @PostMapping("/configuracoes/brasao")
    public ResponseEntity<String> uploadBrasao(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.salvarBrasao(file));
    }

    // --- ENDPOINTS PÚBLICOS (Para o Portal) ---

    @GetMapping("/portal/configuracoes")
    public ResponseEntity<ConfiguracaoDTO.Response> obterConfiguracaoPortal() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @GetMapping("/portal/configuracoes/brasao")
    public ResponseEntity<Resource> servirBrasao() {
        String path = System.getProperty("user.dir") + File.separator + "Imagens";
        File folder = new File(path);
        
        if (!folder.exists()) {
            return ResponseEntity.notFound().build();
        }

        // CORREÇÃO 1: Busca o arquivo que começa APENAS com "brasao"
        File[] files = folder.listFiles((dir, name) -> name.startsWith("brasao"));
        
        if (files != null && files.length > 0) {
            File arquivoImagem = files[0];
            String nomeArquivo = arquivoImagem.getName().toLowerCase();
            
            // CORREÇÃO 2: Tipagem Dinâmica (Impede que o navegador bloqueie JPGs lidos como PNGs)
            MediaType mediaType = MediaType.IMAGE_PNG; // Padrão
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