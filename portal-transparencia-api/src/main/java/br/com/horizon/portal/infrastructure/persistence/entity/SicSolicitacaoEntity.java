package br.com.horizon.portal.infrastructure.persistence.entity;

import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import br.com.horizon.portal.infrastructure.persistence.enums.SicTipo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_sic_solicitacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SicSolicitacaoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String protocolo;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, length = 18)
    private String documento;

    @Column(nullable = false, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_solicitacao", nullable = false)
    private SicTipo tipoSolicitacao;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensagem;

    @Column(name = "url_anexo_solicitacao")
    private String urlAnexoSolicitacao;

    @Column(nullable = false)
    private Boolean sigilo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SicStatus status;

    @CreationTimestamp
    @Column(name = "data_solicitacao", updatable = false)
    private LocalDateTime dataSolicitacao;

    @Column(name = "resposta_oficial", columnDefinition = "TEXT")
    private String respostaOficial;

    @Column(name = "url_anexo_resposta")
    private String urlAnexoResposta;

    @Column(name = "data_resposta")
    private LocalDateTime dataResposta;

    @Column(name = "justificativa_prorrogacao", columnDefinition = "TEXT")
    private String justificativaProrrogacao;

    @Column(name = "usuario_resposta_id")
    private Long usuarioRespostaId;
}