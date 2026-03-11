package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.application.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/configuracoes")
@RequiredArgsConstructor
public class ConfiguracaoPortalController {

    private final ConfiguracaoService service;

    @GetMapping
    public ResponseEntity<ConfiguracaoDTO.Response> obterConfiguracaoPortal() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }
}