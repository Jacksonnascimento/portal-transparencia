package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.ServicoEntity;
import br.com.horizon.portal.application.service.ServicoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portal/servicos")
@CrossOrigin(origins = "*") // Permite acesso do front público
public class PortalServicoController {

    private final ServicoService service;

    public PortalServicoController(ServicoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ServicoEntity>> listarServicosAtivos(
            @RequestParam(name = "busca", required = false) String busca) {
        return ResponseEntity.ok(service.listarAtivosParaPortal(busca));
    }
}