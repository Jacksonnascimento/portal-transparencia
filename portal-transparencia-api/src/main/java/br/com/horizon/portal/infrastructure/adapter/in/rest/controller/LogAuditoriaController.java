package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.LogAuditoriaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.LogAuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auditoria")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LogAuditoriaController {

    private final LogAuditoriaRepository repository;

    @GetMapping
    public ResponseEntity<Page<LogAuditoriaEntity>> listar(
            @PageableDefault(size = 20, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(repository.findAll(pageable));
    }
}