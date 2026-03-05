package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.dto.sic.SicEstatisticasDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoRequestDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoResponseDTO;
import br.com.horizon.portal.application.service.SicSolicitacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/sic/solicitacoes")
@RequiredArgsConstructor
public class PortalSicController {

    private final SicSolicitacaoService service;

    @PostMapping
    public ResponseEntity<SicSolicitacaoResponseDTO> criarSolicitacao(@RequestBody @Valid SicSolicitacaoRequestDTO dto) {
        SicSolicitacaoResponseDTO response = service.criarSolicitacao(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{protocolo}")
    public ResponseEntity<SicSolicitacaoResponseDTO> consultarProtocolo(
            @PathVariable String protocolo,
            @RequestParam String documento) {
        
        // A exigência do documento aqui blinda a consulta contra curiosos (Regra da LAI)
        SicSolicitacaoResponseDTO response = service.consultarProtocolo(protocolo, documento);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<SicEstatisticasDTO> obterEstatisticas() {
        return ResponseEntity.ok(service.obterEstatisticas());
    }
}