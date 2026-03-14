package br.com.horizon.portal.application.dto.folhapagamento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolhaPagamentoPublicoDTO {

    private Long id;
    
    // Dados de identificação pública do Servidor (Sem CPF aqui para evitar redundância e exposição)
    private Long servidorId;
    private String nomeServidor;
    private String cargoServidor;

    // Referência de tempo
    private Integer exercicio;
    private Integer mes;

    // Segregação Financeira (Exigência estrita do TCE e da Cartilha PNTP)
    private BigDecimal remuneracaoBruta;
    private BigDecimal verbasIndenizatorias;
    private BigDecimal descontosLegais;
    private BigDecimal salarioLiquido;

}