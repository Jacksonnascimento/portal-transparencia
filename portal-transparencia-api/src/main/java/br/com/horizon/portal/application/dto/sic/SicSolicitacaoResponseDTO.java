package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SicSolicitacaoResponseDTO {

    private Long id;
    private String protocolo;
    private String nome;
    private String documento;
    private String email;
    private String tipoSolicitacao;
    private String mensagem;
    private SicStatus status;
    private LocalDateTime dataSolicitacao;
    private String respostaOficial;
    private LocalDateTime dataResposta;
    
    // CAMPOS DE ANEXO
    private String urlAnexoSolicitacao; 
    private String urlAnexoResposta;    

    private List<SicTramiteResponseDTO> tramites;

    public static SicSolicitacaoResponseDTO fromEntity(SicSolicitacaoEntity entity) {
        if (entity == null) return null;

        return SicSolicitacaoResponseDTO.builder()
                .id(entity.getId())
                .protocolo(entity.getProtocolo())
                .nome(entity.getNome())
                .documento(entity.getDocumento())
                .email(entity.getEmail())
                // CORREÇÃO AQUI: Transforma o Enum SicTipo em String de forma segura
                .tipoSolicitacao(entity.getTipoSolicitacao() != null ? entity.getTipoSolicitacao().name() : null)
                .mensagem(entity.getMensagem())
                .status(entity.getStatus())
                .dataSolicitacao(entity.getDataSolicitacao())
                .respostaOficial(entity.getRespostaOficial())
                .dataResposta(entity.getDataResposta())
                .urlAnexoSolicitacao(entity.getUrlAnexoSolicitacao())
                .urlAnexoResposta(entity.getUrlAnexoResposta())
                .tramites(entity.getTramites() != null ? 
                        entity.getTramites().stream().map(SicTramiteResponseDTO::fromEntity).collect(Collectors.toList()) 
                        : null)
                .build();
    }
}