package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.service.DespesaService;
import br.com.horizon.portal.infrastructure.adapter.in.rest.dto.DespesaResponse;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/despesas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DespesaController {

    private final DespesaRepository repository;
    private final DespesaService service;

    @GetMapping
    public ResponseEntity<Page<DespesaResponse>> listar(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(repository.findAll(pageable).map(DespesaResponse::fromEntity));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importarCsv(@RequestParam("file") MultipartFile file) {
        service.importarArquivoCsv(file);
        return ResponseEntity.ok("Despesas importadas com sucesso!");
    }
}