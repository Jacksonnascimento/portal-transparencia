package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portal")
@RequiredArgsConstructor
public class PortalController {

    private final ReceitaRepository receitaRepository;

    /**
     * DTO (Data Transfer Object) - O formato exato que será entregue ao Portal.
     *
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
        // Construtor que converte a Entidade (do Banco) para o DTO (do Portal)
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
     * ENDPOINT 1: Listagem Pública de Receitas
     * Rota: GET /api/v1/portal/receitas?page=0&size=20
     */
    @GetMapping("/receitas")
    public ResponseEntity<Page<ReceitaPublicaDTO>> listarReceitasPublicas(
            @PageableDefault(size = 20, sort = {"dataLancamento"}) Pageable pageable) {
        
        // Busca as receitas e converte uma por uma para o formato seguro (DTO)
        Page<ReceitaPublicaDTO> page = receitaRepository.findAll(pageable)
                .map(ReceitaPublicaDTO::fromEntity);
                
        return ResponseEntity.ok(page);
    }

    /**
     * ENDPOINT 2: Resumo para Dashboard (KPIs do Portal)
     * Rota: GET /api/v1/portal/receitas/resumo?ano=2024
     * 
     */
    @GetMapping("/receitas/resumo")
    public ResponseEntity<Map<String, Object>> obterResumoPublico(
            @RequestParam(name = "ano", required = false) Integer ano) {
        
        int anoFiltro = (ano != null) ? ano : LocalDate.now().getYear();

        // Traz todas as receitas do ano para somar (idealmente seria uma query no banco, 
        // mas faremos via stream para agilizar sua entrega de hoje)
        List<ReceitaEntity> receitasDoAno = receitaRepository.findAll().stream()
                .filter(r -> r.getExercicio() != null && r.getExercicio() == anoFiltro)
                .toList();

        BigDecimal totalArrecadado = receitasDoAno.stream()
                .map(ReceitaEntity::getValorArrecadado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("anoReferencia", anoFiltro);
        resumo.put("totalArrecadado", totalArrecadado);
        resumo.put("totalLancamentos", receitasDoAno.size());

        return ResponseEntity.ok(resumo);
    }
}