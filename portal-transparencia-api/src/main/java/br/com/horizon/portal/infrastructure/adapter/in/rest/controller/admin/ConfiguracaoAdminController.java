package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.application.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/configuracoes") 
@RequiredArgsConstructor
public class ConfiguracaoAdminController {

    private final ConfiguracaoService service;

    @GetMapping
    public ResponseEntity<ConfiguracaoDTO.Response> obterParaAdmin() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @PutMapping
    public ResponseEntity<ConfiguracaoDTO.Response> atualizar(@RequestBody ConfiguracaoDTO.Update dto) {
        return ResponseEntity.ok(service.atualizar(dto));
    }
}