package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.service.ReceitaService;
import br.com.horizon.portal.infrastructure.adapter.in.rest.dto.ReceitaResponse;
import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/receitas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReceitaController {

    private final ReceitaRepository repository;
    private final ReceitaService service; // Injetamos o Service novo

    @GetMapping
    public ResponseEntity<Page<ReceitaResponse>> listar(@PageableDefault(size = 10) Pageable pageable) {
        Page<ReceitaEntity> entidades = repository.findAll(pageable);
        return ResponseEntity.ok(entidades.map(ReceitaResponse::fromEntity));
    }

    @GetMapping("/total")
    public ResponseEntity<BigDecimal> totalArrecadado(@RequestParam(defaultValue = "2025") Integer ano) {
        return ResponseEntity.ok(repository.totalArrecadadoPorAno(ano));
    }

    // NOVO ENDPOINT DE UPLOAD
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importarCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Arquivo vazio!");
        }
        
        service.importarArquivoCsv(file);
        
        return ResponseEntity.ok("Arquivo processado com sucesso!");
    }
}