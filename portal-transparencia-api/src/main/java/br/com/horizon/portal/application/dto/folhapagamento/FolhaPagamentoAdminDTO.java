package br.com.horizon.portal.application.dto.folhapagamento;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolhaPagamentoAdminDTO {

    private Long id;
    
    @NotNull(message = "O ID do servidor é obrigatório")
    private Long servidorId;
    
    // Campos de exibição (read-only no DTO)
    private String nomeServidor;
    private String matriculaServidor;
    private String cargoServidor;

    @NotNull(message = "O exercício (ano) é obrigatório")
    @Min(value = 1900, message = "O ano informado é inválido")
    private Integer exercicio;

    @NotNull(message = "O mês é obrigatório")
    @Min(value = 1, message = "O mês deve ser entre 1 e 12")
    @Max(value = 12, message = "O mês deve ser entre 1 e 12")
    private Integer mes;

    @NotNull(message = "A remuneração bruta é obrigatória")
    @PositiveOrZero(message = "A remuneração bruta não pode ser negativa")
    private BigDecimal remuneracaoBruta;

    @NotNull(message = "As verbas indenizatórias são obrigatórias")
    @PositiveOrZero(message = "Verbas indenizatórias não podem ser negativas")
    private BigDecimal verbasIndenizatorias;

    @NotNull(message = "Os descontos legais são obrigatórios")
    @PositiveOrZero(message = "Descontos legais não podem ser negativos")
    private BigDecimal descontosLegais;

    @NotNull(message = "O salário líquido é obrigatório")
    @PositiveOrZero(message = "O salário líquido não pode ser negativo")
    private BigDecimal salarioLiquido;

    // Dados de Auditoria
    private String idImportacao;
    private String criadoPor;
    private String atualizadoPor;
    private LocalDateTime criadoEm;
    private LocalDateTime updatedEm; // Mapeado como atualizadoEm na entity

}