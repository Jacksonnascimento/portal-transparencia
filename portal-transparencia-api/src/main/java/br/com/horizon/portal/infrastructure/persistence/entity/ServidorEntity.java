package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "servidor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServidorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, length = 14)
    private String cpf;

    @Column(length = 50)
    private String matricula;

    @Column(nullable = false, length = 150)
    private String cargo;

    @Column(nullable = false, length = 150)
    private String lotacao;

    @Column(name = "tipo_vinculo", nullable = false, length = 50)
    private String tipoVinculo; // EFETIVO, COMISSIONADO, TERCEIRIZADO, ESTAGIARIO

    @Column(name = "data_admissao", nullable = false)
    private LocalDate dataAdmissao;

    @Column(name = "data_exoneracao")
    private LocalDate dataExoneracao;

    @Column(name = "carga_horaria")
    private Integer cargaHoraria;

    // Exigência exclusiva do PNTP para Terceirizados
    @Column(name = "empresa_contratante", length = 150)
    private String empresaContratante;

    @Column(name = "cnpj_contratante", length = 18)
    private String cnpjContratante;

    // Campos de Auditoria e Rastreabilidade
    @Column(name = "id_importacao", length = 50)
    private String idImportacao;

    @Column(name = "criado_por", length = 100)
    private String criadoPor;

    @Column(name = "atualizado_por", length = 100)
    private String atualizadoPor;

    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    protected void onCreate() {
        this.criadoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}