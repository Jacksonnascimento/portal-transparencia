package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SicTramiteRequestDTO {
    
    @NotNull(message = "O novo status é obrigatório")
    private SicStatus status;
    
    private String resposta;
    private String urlAnexo;
}