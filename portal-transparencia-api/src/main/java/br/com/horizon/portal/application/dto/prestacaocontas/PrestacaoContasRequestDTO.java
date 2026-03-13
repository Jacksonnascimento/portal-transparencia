package br.com.horizon.portal.application.dto.prestacaocontas;

import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PrestacaoContasRequestDTO {

    @NotNull(message = "O tipo de relatório é obrigatório")
    private TipoRelatorio tipoRelatorio;

    @NotNull(message = "O exercício (ano) é obrigatório")
    private Integer exercicio;

    private Integer periodo; // Pode ser nulo se for Balanço Geral (anual)

    @NotNull(message = "O tipo de período é obrigatório")
    private TipoPeriodo tipoPeriodo;

    @NotNull(message = "A data de publicação é obrigatória")
    private LocalDate dataPublicacao;
}