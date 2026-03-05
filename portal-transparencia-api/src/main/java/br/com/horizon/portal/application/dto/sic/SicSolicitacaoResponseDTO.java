package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SicSolicitacaoResponseDTO {
    private String protocolo;
    private SicStatus status;
    private LocalDateTime dataSolicitacao;
    
    // Dados da Resposta
    private String respostaOficial;
    private String urlAnexoResposta;
    private LocalDateTime dataResposta;
    private String justificativaProrrogacao;
}