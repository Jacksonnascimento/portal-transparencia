package br.com.horizon.portal.application.dto.receita;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ReceitaResponse {

    private Long id;
    private Integer exercicio;
    private Integer mes;
    private LocalDate dataLancamento;
    
    // Classificação
    private String categoriaEconomica;
    private String origem;
    private String especie;
    private String rubrica;
    private String alinea;
    
    private String fonteRecursos;
    
    // Valores Orçamentários e Financeiros
    private BigDecimal valorPrevistoInicial;
    private BigDecimal valorPrevistoAtualizado;
    private BigDecimal valorArrecadado;
    
    private String historico;

    public static ReceitaResponse fromEntity(ReceitaEntity entity) {
        return ReceitaResponse.builder()
                .id(entity.getId())
                .exercicio(entity.getExercicio())
                .mes(entity.getMes())
                .dataLancamento(entity.getDataLancamento())
                .categoriaEconomica(entity.getCategoriaEconomica())
                .origem(entity.getOrigem())
                .especie(entity.getEspecie())
                .rubrica(entity.getRubrica())
                .alinea(entity.getAlinea())
                .fonteRecursos(entity.getFonteRecursos())
                .valorPrevistoInicial(entity.getValorPrevistoInicial())
                .valorPrevistoAtualizado(entity.getValorPrevistoAtualizado())
                .valorArrecadado(entity.getValorArrecadado())
                .historico(entity.getHistorico())
                .build();
    }
}