package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.ServicoEntity;
import br.com.horizon.portal.application.service.ServicoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/servicos")
public class ServicoAdminController {

    private final ServicoService service;

    public ServicoAdminController(ServicoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ServicoEntity>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @PostMapping
    public ResponseEntity<ServicoEntity> criar(@RequestBody ServicoEntity entity) {
        return ResponseEntity.ok(service.criar(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicoEntity> atualizar(@PathVariable UUID id, @RequestBody ServicoEntity entity) {
        return ResponseEntity.ok(service.atualizar(id, entity));
    }
}