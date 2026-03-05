package br.com.horizon.portal.infrastructure.persistence.entity;

import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Entity
@Table(name = "tb_sic_tramite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SicTramiteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SicStatus status;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descricao;

    @Column(name = "data_tramite", nullable = false)
    private LocalDateTime dataTramite;

    @Column(name = "usuario_id")
    private Long usuarioId;

    // Relacionamento N:1 (Vários trâmites pertencem a 1 Solicitação)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitacao_id", nullable = false)
    private SicSolicitacaoEntity solicitacao;
}