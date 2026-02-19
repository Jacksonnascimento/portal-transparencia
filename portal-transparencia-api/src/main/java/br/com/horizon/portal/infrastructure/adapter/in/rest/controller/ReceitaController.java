package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.service.ReceitaService;
import br.com.horizon.portal.infrastructure.adapter.in.rest.dto.ReceitaResponse;
import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/receitas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReceitaController {

    private final ReceitaRepository repository;
    private final ReceitaService service;

    @GetMapping
    public ResponseEntity<Page<ReceitaResponse>> listar(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String fonte,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataImportacaoInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataImportacaoFim,
            @PageableDefault(size = 20, sort = "dataLancamento") Pageable pageable) {

        Specification<ReceitaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (exercicio != null)
                predicates.add(cb.equal(root.get("exercicio"), exercicio));
            if (origem != null && !origem.isEmpty())
                predicates.add(cb.like(cb.lower(root.get("origem")), "%" + origem.toLowerCase() + "%"));
            if (categoria != null && !categoria.isEmpty())
                predicates.add(cb.like(cb.lower(root.get("categoriaEconomica")), "%" + categoria.toLowerCase() + "%"));
            if (fonte != null && !fonte.isEmpty())
                predicates.add(cb.like(cb.lower(root.get("fonteRecursos")), "%" + fonte.toLowerCase() + "%"));

            // Filtro 1: Data de Lançamento (Contábil)
            if (dataInicio != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("dataLancamento"), dataInicio));
            if (dataFim != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("dataLancamento"), dataFim));

            // Filtro 2: Data de Importação (Auditoria do Sistema)
            // Como dataImportacao é LocalDateTime, convertemos o LocalDate para o
            // início/fim do dia
            if (dataImportacaoInicio != null)
                predicates
                        .add(cb.greaterThanOrEqualTo(root.get("dataImportacao"), dataImportacaoInicio.atStartOfDay()));
            if (dataImportacaoFim != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("dataImportacao"), dataImportacaoFim.atTime(23, 59, 59)));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return ResponseEntity.ok(repository.findAll(spec, pageable).map(ReceitaResponse::fromEntity));
    }

    // NOVO ENDPOINT: Retorna a lista de anos para o filtro do Frontend
    @GetMapping("/anos")
    public ResponseEntity<List<Integer>> listarAnosDisponiveis() {
        return ResponseEntity.ok(repository.findDistinctExercicios());
    }

    @GetMapping("/total")
    public ResponseEntity<BigDecimal> totalArrecadado(@RequestParam Integer ano) {
        return ResponseEntity.ok(repository.totalArrecadadoPorAno(ano));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importarCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body("Arquivo vazio!");
        service.importarArquivoCsv(file);
        return ResponseEntity.ok("Arquivo processado com sucesso!");
    }
}