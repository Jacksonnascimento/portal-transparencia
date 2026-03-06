package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.diarias.DiariaPassagemDTO;
import br.com.horizon.portal.application.service.DiariaPassagemService;
import br.com.horizon.portal.infrastructure.persistence.entity.DiariaPassagemEntity;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/diarias")
@RequiredArgsConstructor
public class AdminDiariaPassagemController {

    private final DiariaPassagemService service;

    @PostMapping
    public ResponseEntity<DiariaPassagemDTO.Response> criar(@RequestBody @Valid DiariaPassagemDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiariaPassagemDTO.Response> atualizar(
            @PathVariable Long id, 
            @RequestBody @Valid DiariaPassagemDTO.Request dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiariaPassagemDTO.Response> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<Page<DiariaPassagemDTO.Response>> listar(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String nomeFavorecido,
            @RequestParam(required = false) String destinoViagem,
            @RequestParam(required = false) String numeroProcesso,
            @PageableDefault(size = 20, sort = "dataSaida", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {

        Specification<DiariaPassagemEntity> spec = buildSpecification(exercicio, nomeFavorecido, destinoViagem, numeroProcesso);
        return ResponseEntity.ok(service.listarPaginado(spec, pageable));
    }

    // --- ENDPOINTS DE EXPORTAÇÃO ---

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String nomeFavorecido,
            @RequestParam(required = false) String destinoViagem,
            @RequestParam(required = false) String numeroProcesso) {

        Specification<DiariaPassagemEntity> spec = buildSpecification(exercicio, nomeFavorecido, destinoViagem, numeroProcesso);
        byte[] conteudo = service.exportarCsv(spec, false); // Admin vê dado real (sem máscara)

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=diarias_passagens.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(conteudo);
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String nomeFavorecido,
            @RequestParam(required = false) String destinoViagem,
            @RequestParam(required = false) String numeroProcesso) {

        Specification<DiariaPassagemEntity> spec = buildSpecification(exercicio, nomeFavorecido, destinoViagem, numeroProcesso);
        byte[] conteudo = service.exportarPdf(spec, false); // Admin vê dado real (sem máscara)

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=diarias_passagens.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(conteudo);
    }

    // --- MÉTODOS PRIVADOS ---

    private Specification<DiariaPassagemEntity> buildSpecification(
            Integer exercicio, String nomeFavorecido, String destinoViagem, String numeroProcesso) {
        
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filtra apenas registros ativos
            predicates.add(builder.isTrue(root.get("ativo")));

            if (exercicio != null) {
                predicates.add(builder.equal(root.get("exercicio"), exercicio));
            }
            if (nomeFavorecido != null && !nomeFavorecido.isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("nomeFavorecido")), "%" + nomeFavorecido.toLowerCase() + "%"));
            }
            if (destinoViagem != null && !destinoViagem.isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("destinoViagem")), "%" + destinoViagem.toLowerCase() + "%"));
            }
            if (numeroProcesso != null && !numeroProcesso.isBlank()) {
                predicates.add(builder.equal(root.get("numeroProcesso"), numeroProcesso));
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }
}