package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import br.com.horizon.portal.infrastructure.persistence.enums.SicTipo;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class SicSolicitacaoResponseDTO {
    // CAMPOS ADICIONADOS PARA O RETAGUARDA FUNCIONAR
    private Long id; 
    private String protocolo;
    private String nome;
    private String documento;
    private String email;
    private SicTipo tipoSolicitacao;
    private String mensagem;
    
    // Status e Datas
    private SicStatus status;
    private LocalDateTime dataSolicitacao;
    
    // Dados da Resposta
    private String respostaOficial;
    private String urlAnexoResposta;
    private LocalDateTime dataResposta;
    private String justificativaProrrogacao;

    // Histórico
    private List<SicTramiteResponseDTO> tramites;

    public static SicSolicitacaoResponseDTO fromEntity(SicSolicitacaoEntity entity) {
        if (entity == null) return null;

        return SicSolicitacaoResponseDTO.builder()
                .id(entity.getId())
                .protocolo(entity.getProtocolo())
                .nome(entity.getNome())
                .documento(entity.getDocumento())
                .email(entity.getEmail())
                .tipoSolicitacao(entity.getTipoSolicitacao())
                .mensagem(entity.getMensagem())
                .status(entity.getStatus())
                .dataSolicitacao(entity.getDataSolicitacao())
                .respostaOficial(entity.getRespostaOficial())
                .urlAnexoResposta(entity.getUrlAnexoResposta())
                .dataResposta(entity.getDataResposta())
                .justificativaProrrogacao(entity.getJustificativaProrrogacao())
                .tramites(entity.getTramites() != null 
                        ? entity.getTramites().stream()
                            .map(SicTramiteResponseDTO::fromEntity)
                            .collect(Collectors.toList()) 
                        : new ArrayList<>())
                .build();
    }
}