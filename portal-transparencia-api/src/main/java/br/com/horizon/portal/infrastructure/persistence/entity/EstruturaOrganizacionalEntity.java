package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "estrutura_organizacional")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstruturaOrganizacionalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nome_orgao", nullable = false)
    private String nomeOrgao;

    @Column(name = "sigla")
    private String sigla;

    @Column(name = "nome_dirigente", nullable = false)
    private String nomeDirigente;

    @Column(name = "cargo_dirigente", nullable = false)
    private String cargoDirigente;

    @Column(name = "horario_atendimento")
    private String horarioAtendimento;

    @Column(name = "endereco_completo", columnDefinition = "TEXT")
    private String enderecoCompleto;

    @Column(name = "telefone_contato")
    private String telefoneContato;

    @Column(name = "email_institucional")
    private String emailInstitucional;

    @Column(name = "link_curriculo", columnDefinition = "TEXT")
    private String linkCurriculo; // A bala de prata para o TCE

    // NOVO: Campo para armazenar a URL ou path da Foto Institucional do Dirigente
    @Column(name = "url_foto_dirigente", columnDefinition = "TEXT")
    private String urlFotoDirigente;

    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @Column(name = "criado_por")
    private String criadoPor;

    @Column(name = "atualizado_por")
    private String atualizadoPor;

    @PrePersist
    public void prePersist() {
        this.criadoEm = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}