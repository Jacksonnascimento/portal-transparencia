package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "folha_pagamento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolhaPagamentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relação 1:N com Servidor - Lazy loading para performance
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servidor_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ServidorEntity servidor;

    @Column(nullable = false)
    private Integer exercicio;

    @Column(nullable = false)
    private Integer mes;

    // Campos Financeiros Segregados (Exigência TCE)
    @Column(name = "remuneracao_bruta", nullable = false, precision = 15, scale = 2)
    private BigDecimal remuneracaoBruta;

    @Column(name = "verbas_indenizatorias", nullable = false, precision = 15, scale = 2)
    private BigDecimal verbasIndenizatorias;

    @Column(name = "descontos_legais", nullable = false, precision = 15, scale = 2)
    private BigDecimal descontosLegais;

    @Column(name = "salario_liquido", nullable = false, precision = 15, scale = 2)
    private BigDecimal salarioLiquido;

    // Campos de Auditoria e Rastreabilidade (Rollback)
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