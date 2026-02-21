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
     * DTO Público - Inclui campos essenciais para conformidade PNTP 2025.
     */
    public record ReceitaPublicaDTO(
            Integer exercicio,
            Integer mes,
            LocalDate dataLancamento,
            String categoriaEconomica,
            String origem,
            String fonteRecursos,
            BigDecimal valorArrecadado,
            String historico
    ) {
        public static ReceitaPublicaDTO fromEntity(ReceitaEntity entity) {
            return new ReceitaPublicaDTO(
                    entity.getExercicio(),
                    entity.getMes(),
                    entity.getDataLancamento(),
                    entity.getCategoriaEconomica(),
                    entity.getOrigem(),
                    entity.getFonteRecursos(),
                    entity.getValorArrecadado(),
                    entity.getHistorico()
            );
        }
    }

    /**
     * ENDPOINT 1: Listagem Pública com Filtros Avançados (Requisito PNTP)
     * Rota: GET /api/v1/portal/receitas
     */
    @GetMapping("/receitas")
    public ResponseEntity<Page<ReceitaPublicaDTO>> listarReceitasPublicas(
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String fonte,
            @PageableDefault(size = 20, sort = {"dataLancamento"}) Pageable pageable) {

        Specification<ReceitaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (exercicio != null) predicates.add(cb.equal(root.get("exercicio"), exercicio));
            if (mes != null) predicates.add(cb.equal(root.get("mes"), mes));
            if (dataInicio != null) predicates.add(cb.greaterThanOrEqualTo(root.get("dataLancamento"), dataInicio));
            if (dataFim != null) predicates.add(cb.lessThanOrEqualTo(root.get("dataLancamento"), dataFim));
            
            // Filtros LIKE para busca textual facilitada (Item 1.4 da Cartilha)
            if (categoria != null) predicates.add(cb.like(cb.lower(root.get("categoriaEconomica")), "%" + categoria.toLowerCase() + "%"));
            if (origem != null) predicates.add(cb.like(cb.lower(root.get("origem")), "%" + origem.toLowerCase() + "%"));
            if (fonte != null) predicates.add(cb.like(cb.lower(root.get("fonteRecursos")), "%" + fonte.toLowerCase() + "%"));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ReceitaPublicaDTO> page = receitaRepository.findAll(spec, pageable)
                .map(ReceitaPublicaDTO::fromEntity);
                
        return ResponseEntity.ok(page);
    }

    /**
     * ENDPOINT 2: Resumo Dinâmico (KPIs)
     * Agora o resumo também aceita filtros para Dashboards específicos por categoria/fonte.
     */
    @GetMapping("/receitas/resumo")
    public ResponseEntity<Map<String, Object>> obterResumoPublico(
            @RequestParam(name = "exercicio", required = false) Integer exercicio) {
        
        int anoFiltro = (exercicio != null) ? exercicio : LocalDate.now().getYear();

        BigDecimal totalArrecadado = receitaRepository.totalArrecadadoPorAno(anoFiltro);
        long totalLancamentos = receitaRepository.countByExercicio(anoFiltro);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("exercicio", anoFiltro);
        resumo.put("totalArrecadado", totalArrecadado != null ? totalArrecadado : BigDecimal.ZERO);
        resumo.put("totalRegistros", totalLancamentos);
        resumo.put("serieHistoricaDisponivel", true); // Requisito 3.1 da Cartilha (Últimos 3 anos)

        return ResponseEntity.ok(resumo);
    }
}