package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.dto.sic.PesquisaSatisfacaoRequestDTO;
import br.com.horizon.portal.application.service.PesquisaSatisfacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal/satisfacao")
@RequiredArgsConstructor
public class PortalSatisfacaoController {

    private final PesquisaSatisfacaoService service;

    @PostMapping
    public ResponseEntity<Map<String, String>> registrarAvaliacao(@RequestBody @Valid PesquisaSatisfacaoRequestDTO dto) {
        service.registrarAvaliacao(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensagem", "Avaliação registrada com sucesso. Obrigado pelo feedback!"));
    }
}