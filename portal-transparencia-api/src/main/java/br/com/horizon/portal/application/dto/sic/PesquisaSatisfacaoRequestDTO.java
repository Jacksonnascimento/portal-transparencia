package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.enums.ModuloAvaliado;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PesquisaSatisfacaoRequestDTO {
    
    @NotNull(message = "A nota é obrigatória")
    @Min(value = 1, message = "A nota mínima é 1")
    @Max(value = 5, message = "A nota máxima é 5")
    private Integer nota;

    private String comentario;

    @NotNull(message = "O módulo avaliado deve ser informado")
    private ModuloAvaliado moduloAvaliado;
}