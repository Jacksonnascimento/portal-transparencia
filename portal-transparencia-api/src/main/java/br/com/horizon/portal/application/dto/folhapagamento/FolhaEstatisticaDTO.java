package br.com.horizon.portal.application.dto.folhapagamento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolhaEstatisticaDTO {

    // Totais Financeiros do Período
    private BigDecimal totalRemuneracaoBruta;
    private BigDecimal totalVerbasIndenizatorias;
    private BigDecimal totalDescontosLegais;
    private BigDecimal totalSalarioLiquido;

    // Métricas de Quantidade
    private Long quantidadeServidoresPagos;
    private BigDecimal mediaSalarialLiquida;
    private BigDecimal maiorSalarioLiquido;

    // Dados para Gráficos (Distribuição)
    // Ex: {"Efetivo": 150000.00, "Comissionado": 45000.00}
    private Map<String, BigDecimal> distribuicaoPorTipoVinculo;
    
    // Ex: {"Secretaria de Saúde": 500000.00, "Educação": 450000.00}
    private Map<String, BigDecimal> distribuicaoPorLotacao;

    private Integer exercicio;
    private Integer mes;
}