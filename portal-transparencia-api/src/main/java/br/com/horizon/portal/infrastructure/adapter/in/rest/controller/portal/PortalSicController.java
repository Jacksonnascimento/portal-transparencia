package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.sic.SicEstatisticasDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoRequestDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoResponseDTO;
import br.com.horizon.portal.application.service.SicSolicitacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    // NOVO: Rota para o cidadão entrar com recurso
    @PostMapping("/{protocolo}/recurso")
    public ResponseEntity<Void> entrarComRecurso(
            @PathVariable String protocolo,
            @RequestBody Map<String, String> payload) {
        
        String documento = payload.get("documento");
        String justificativa = payload.get("justificativa");
        
        service.entrarComRecurso(protocolo, documento, justificativa);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<SicEstatisticasDTO> obterEstatisticas() {
        return ResponseEntity.ok(service.obterEstatisticas());
    }
}