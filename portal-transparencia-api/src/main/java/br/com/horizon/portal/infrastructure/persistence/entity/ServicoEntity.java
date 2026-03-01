package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_servico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "setor_responsavel", nullable = false)
    private String setorResponsavel;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String requisitos;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String etapas;

    @Column(name = "prazo_maximo", nullable = false)
    private String prazoMaximo;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_prestacao", nullable = false)
    private FormaPrestacao formaPrestacao;

    @Column(name = "detalhes_prestacao", nullable = false, columnDefinition = "TEXT")
    private String detalhesPrestacao;

    @Column(name = "canais_manifestacao", nullable = false, columnDefinition = "TEXT")
    private String canaisManifestacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusServico status;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @PrePersist
    protected void onCreate() {
        this.criadoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
        if (this.status == null) this.status = StatusServico.ATIVO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }

    public enum StatusServico { ATIVO, INATIVO }
    public enum FormaPrestacao { PRESENCIAL, ONLINE, HIBRIDO }
}