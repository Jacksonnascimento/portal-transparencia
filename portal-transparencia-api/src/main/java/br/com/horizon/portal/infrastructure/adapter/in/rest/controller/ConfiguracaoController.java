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

    /**
     * Rota de leitura para o Admin. 
     * Resolve o erro 405 que ocorria ao carregar a página de configurações.
     */
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

    // --- ENDPOINTS PÚBLICOS (Para o Portal do seu sócio) ---

    @GetMapping("/portal/configuracoes")
    public ResponseEntity<ConfiguracaoDTO.Response> obterConfiguracaoPortal() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @GetMapping("/portal/configuracoes/brasao")
    public ResponseEntity<Resource> servirBrasao() {
        String path = System.getProperty("user.dir") + File.separator + "Imagens";
        File folder = new File(path);
        
        // Verifica se a pasta existe antes de tentar listar
        if (!folder.exists()) {
            return ResponseEntity.notFound().build();
        }

        // Busca o arquivo que começa com "brasao_oficial"
        File[] files = folder.listFiles((dir, name) -> name.startsWith("brasao_oficial"));
        
        if (files != null && files.length > 0) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                    .body(new FileSystemResource(files[0]));
        }
        return ResponseEntity.notFound().build();
    }
}