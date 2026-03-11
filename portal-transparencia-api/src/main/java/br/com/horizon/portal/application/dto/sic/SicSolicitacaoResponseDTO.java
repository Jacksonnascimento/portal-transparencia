package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
    private String urlAnexoSolicitacao; 
    private String urlAnexoResposta;    
    
    // NOVO: Flag de sigilo para o Frontend interpretar e mascarar os dados
    private boolean sigilo; 
    
    // CAMPOS DE INTELIGÊNCIA DE PRAZO
    private long diasRestantes;
    private boolean emAlerta;
    private boolean expirado;
    private String descricaoPrazo; // NOVO: Para exibir "VENCE HOJE", "EXPIRADO", etc.

    private List<SicTramiteResponseDTO> tramites;

    public static SicSolicitacaoResponseDTO fromEntity(SicSolicitacaoEntity entity) {
        if (entity == null) return null;

        // 1. Definição do Prazo Legal (Regra da LAI)
        int prazoLegal = (entity.getStatus() == SicStatus.PRORROGADO) ? 30 : 20;
        
        // 2. Cálculo de dias (Diferença entre hoje e a abertura)
        long diasDecorridos = ChronoUnit.DAYS.between(entity.getDataSolicitacao(), LocalDateTime.now());
        long restantes = prazoLegal - diasDecorridos;

        // 3. Verificação de conclusão
        boolean concluido = entity.getStatus() == SicStatus.RESPONDIDO || entity.getStatus() == SicStatus.NEGADO;

        // 4. Lógica da Descrição Textual (Onde matamos o "0 dias")
        String textoPrazo;
        if (concluido) {
            textoPrazo = "Concluído";
        } else if (restantes < 0) {
            textoPrazo = "EXPIRADO";
        } else if (restantes == 0) {
            textoPrazo = "VENCE HOJE";
        } else if (restantes == 1) {
            textoPrazo = "Vence amanhã";
        } else {
            textoPrazo = restantes + " dias restantes";
        }

        return SicSolicitacaoResponseDTO.builder()
                .id(entity.getId())
                .protocolo(entity.getProtocolo())
                .nome(entity.getNome())
                .documento(entity.getDocumento())
                .email(entity.getEmail())
                .tipoSolicitacao(entity.getTipoSolicitacao() != null ? entity.getTipoSolicitacao().name() : null)
                .mensagem(entity.getMensagem())
                .status(entity.getStatus())
                .dataSolicitacao(entity.getDataSolicitacao())
                .respostaOficial(entity.getRespostaOficial())
                .dataResposta(entity.getDataResposta())
                .urlAnexoSolicitacao(entity.getUrlAnexoSolicitacao())
                .urlAnexoResposta(entity.getUrlAnexoResposta())
                // Capturando o booleano de forma segura (previne NullPointerException se o campo estiver nulo na base legada)
                .sigilo(Boolean.TRUE.equals(entity.getSigilo())) 
                .diasRestantes(!concluido ? restantes : 0)
                .emAlerta(!concluido && restantes <= 3 && restantes >= 0)
                .expirado(!concluido && restantes < 0)
                .descricaoPrazo(textoPrazo)
                .tramites(entity.getTramites() != null ? 
                        entity.getTramites().stream().map(SicTramiteResponseDTO::fromEntity).collect(Collectors.toList()) 
                        : null)
                .build();
    }
}