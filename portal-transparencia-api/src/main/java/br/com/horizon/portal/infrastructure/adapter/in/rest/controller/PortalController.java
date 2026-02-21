package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal")
@RequiredArgsConstructor
public class PortalController {

    private final ReceitaRepository receitaRepository;

    /**
     * DTO Público para conformidade com a Cartilha PNTP 2025.
     */
    public record ReceitaPublicaDTO(
            Integer exercicio, Integer mes, LocalDate dataLancamento,
            String categoriaEconomica, String origem, String fonteRecursos,
            BigDecimal valorArrecadado, String historico
    ) {
        public static ReceitaPublicaDTO fromEntity(ReceitaEntity entity) {
            return new ReceitaPublicaDTO(
                    entity.getExercicio(), entity.getMes(), entity.getDataLancamento(),
                    entity.getCategoriaEconomica(), entity.getOrigem(), entity.getFonteRecursos(),
                    entity.getValorArrecadado(), entity.getHistorico()
            );
        }
    }

    /**
     * ENDPOINT 1: Listagem com Filtros Avançados
     */
    @GetMapping("/receitas")
    public ResponseEntity<Page<ReceitaPublicaDTO>> listarReceitasPublicas(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String fonte,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @PageableDefault(size = 20, sort = {"dataLancamento"}) Pageable pageable) {

        Specification<ReceitaEntity> spec = criarSpecification(exercicio, origem, categoria, fonte, dataInicio, dataFim);
        Page<ReceitaPublicaDTO> page = receitaRepository.findAll(spec, pageable).map(ReceitaPublicaDTO::fromEntity);
        
        return ResponseEntity.ok(page);
    }

    /**
     * ENDPOINT 2: Resumo (KPIs) com os MESMOS filtros da listagem.
     * Essencial para que o Dashboard acompanhe a navegação do usuário.
     */
    @GetMapping("/receitas/resumo")
    public ResponseEntity<Map<String, Object>> obterResumoPublico(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String fonte,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        Specification<ReceitaEntity> spec = criarSpecification(exercicio, origem, categoria, fonte, dataInicio, dataFim);

        // 1. Contagem total baseada nos filtros
        long totalRegistros = receitaRepository.count(spec);

        // 2. Cálculo da soma baseada nos filtros
        // Buscamos a lista filtrada para somar (Em produção, o ideal é uma query agregada no Repository)
        List<ReceitaEntity> filtrados = receitaRepository.findAll(spec);
        BigDecimal totalArrecadado = filtrados.stream()
                .map(ReceitaEntity::getValorArrecadado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("totalArrecadado", totalArrecadado);
        resumo.put("totalRegistros", totalRegistros);
        resumo.put("filtrosAplicados", buildFiltrosAtivos(exercicio, origem, categoria));

        return ResponseEntity.ok(resumo);
    }

    /**
     * Helper para centralizar a lógica de filtros (DRY - Don't Repeat Yourself)
     */
    private Specification<ReceitaEntity> criarSpecification(Integer exercicio, String origem, String categoria, 
                                                            String fonte, LocalDate start, LocalDate end) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (exercicio != null) predicates.add(cb.equal(root.get("exercicio"), exercicio));
            if (origem != null && !origem.isBlank()) predicates.add(cb.like(cb.lower(root.get("origem")), "%" + origem.toLowerCase() + "%"));
            if (categoria != null && !categoria.isBlank()) predicates.add(cb.like(cb.lower(root.get("categoriaEconomica")), "%" + categoria.toLowerCase() + "%"));
            if (fonte != null && !fonte.isBlank()) predicates.add(cb.like(cb.lower(root.get("fonteRecursos")), "%" + fonte.toLowerCase() + "%"));
            if (start != null) predicates.add(cb.greaterThanOrEqualTo(root.get("dataLancamento"), start));
            if (end != null) predicates.add(cb.lessThanOrEqualTo(root.get("dataLancamento"), end));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String buildFiltrosAtivos(Integer exercicio, String origem, String categoria) {
        return String.format("Ano: %s | Origem: %s", 
                exercicio != null ? exercicio : "Todos", 
                origem != null ? origem : "Todas");
    }
}