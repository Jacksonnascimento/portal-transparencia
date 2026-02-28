package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.dto.faq.FaqDTO;
import br.com.horizon.portal.application.service.FaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/faqs")
@RequiredArgsConstructor
public class FaqAdminController {

    private final FaqService service;

    @GetMapping
    public ResponseEntity<Page<FaqDTO.Response>> listarTodos(
            @RequestParam(required = false) String busca,
            Pageable pageable) {
        return ResponseEntity.ok(service.listarTodosAdmin(busca, pageable));
    }

    @PostMapping
    public ResponseEntity<FaqDTO.Response> criar(@RequestBody FaqDTO.Request request) {
        return ResponseEntity.ok(service.criar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FaqDTO.Response> atualizar(@PathVariable Long id, @RequestBody FaqDTO.Request request) {
        return ResponseEntity.ok(service.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}