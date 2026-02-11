package br.com.horizon.portal.infrastructure.adapter.in.rest.dto;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ReceitaResponse {
    // Apenas o que interessa para o Portal da Transparência
    private String categoria;
    private String origem;
    private String fonteRecursos;
    private LocalDate data;
    private BigDecimal valorArrecadado;

    // Construtor estático para converter Entity -> DTO rapidamente
    public static ReceitaResponse fromEntity(ReceitaEntity entity) {
        ReceitaResponse dto = new ReceitaResponse();
        dto.setCategoria(entity.getCategoriaEconomica());
        dto.setOrigem(entity.getOrigem());
        dto.setFonteRecursos(entity.getFonteRecursos());
        dto.setData(entity.getDataLancamento());
        dto.setValorArrecadado(entity.getValorArrecadado());
        return dto;
    }
}