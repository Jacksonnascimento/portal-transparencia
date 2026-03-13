package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_despesa")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DespesaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer exercicio;

    @Column(name = "numero_empenho", nullable = false, length = 50)
    private String numeroEmpenho;

    @Column(name = "data_empenho", nullable = false)
    private LocalDate dataEmpenho;

    @Column(name = "orgao_codigo", length = 10)
    private String orgaoCodigo;

    @Column(name = "orgao_nome")
    private String orgaoNome;

    @Column(name = "unidade_codigo", length = 10)
    private String unidadeCodigo;

    @Column(name = "unidade_nome")
    private String unidadeNome;

    @Column(length = 100)
    private String funcao;

    @Column(length = 100)
    private String subfuncao;

    @Column(length = 100)
    private String programa;

    @Column(name = "acao_governo", length = 100)
    private String acaoGoverno;

    @Column(name = "elemento_despesa", length = 100)
    private String elementoDespesa;

    @Column(name = "fonte_recursos", length = 100)
    private String fonteRecursos;

    // --- RELACIONAMENTO COM CREDOR ---
    // FetchType.LAZY garante performance: só busca o credor no banco se a gente pedir explicitamente.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credor_id")
    private CredorEntity credor;

    // --- VALORES FINANCEIROS ---
    @Column(name = "valor_empenhado", precision = 19, scale = 2)
    private BigDecimal valorEmpenhado;

    @Column(name = "valor_liquidado", precision = 19, scale = 2)
    private BigDecimal valorLiquidado;

    @Column(name = "data_liquidacao")
    private LocalDate dataLiquidacao;

    @Column(name = "valor_pago", precision = 19, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    @Column(name = "historico_objetivo", columnDefinition = "TEXT")
    private String historicoObjetivo;

    @Column(name = "modalidade_licitacao", length = 100)
    private String modalidadeLicitacao;

    // --- TRILHA DE AUDITORIA E INGESTÃO ---
    @Column(name = "data_importacao")
    private LocalDateTime dataImportacao;

    @Column(name = "id_importacao")
    private String idImportacao;
    
    // Garantindo que a data de importação seja preenchida automaticamente antes de salvar
    @PrePersist
    protected void onCreate() {
        this.dataImportacao = LocalDateTime.now();
    }
}