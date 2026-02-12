package br.com.horizon.portal.infrastructure.adapter.in.rest.dto;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ReceitaResponse {

    // Adicionamos os campos que faltavam (ID e Exercício)
    private Long id;
    private Integer exercicio;
    private Integer mes;
    
    // Campos de negócio
    private String categoria;
    private String origem;
    private String fonteRecursos;
    
    // IMPORTANTE: Mudei de 'data' para 'dataLancamento' para facilitar a ordenação no front
    private LocalDate dataLancamento; 
    
    private BigDecimal valorArrecadado;

    // Construtor estático (Converter Entity -> DTO)
    public static ReceitaResponse fromEntity(ReceitaEntity entity) {
        ReceitaResponse dto = new ReceitaResponse();
        
        dto.setId(entity.getId());
        dto.setExercicio(entity.getExercicio());
        
        // CORREÇÃO AQUI: Trocado 'item' por 'entity'
        dto.setMes(entity.getMes()); 
        
        dto.setCategoria(entity.getCategoriaEconomica());
        dto.setOrigem(entity.getOrigem());
        dto.setFonteRecursos(entity.getFonteRecursos());
        
        // Mapeando a data corretamente
        dto.setDataLancamento(entity.getDataLancamento());
        
        dto.setValorArrecadado(entity.getValorArrecadado());
        
        return dto;
    }
}