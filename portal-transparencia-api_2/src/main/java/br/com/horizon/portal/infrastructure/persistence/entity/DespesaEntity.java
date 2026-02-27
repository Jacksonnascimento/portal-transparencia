package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

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

    @Column(name = "numero_empenho", nullable = false)
    private String numeroEmpenho;

    @Column(name = "data_empenho", nullable = false)
    private LocalDate dataEmpenho;

    // --- Classificação Institucional ---
    @Column(name = "orgao_codigo")
    private String orgaoCodigo;
    
    @Column(name = "orgao_nome")
    private String orgaoNome; // Ex: Secretaria de Saúde
    
    @Column(name = "unidade_codigo")
    private String unidadeCodigo;
    
    @Column(name = "unidade_nome")
    private String unidadeNome;

    // --- Classificação Funcional ---
    private String funcao;       // Ex: Saúde
    private String subfuncao;    // Ex: Atenção Básica
    private String programa;
    
    @Column(name = "acao_governo")
    private String acaoGoverno;

    // --- Classificação Natureza ---
    @Column(name = "elemento_despesa")
    private String elementoDespesa; // Ex: 339030 (Material de Consumo)
    
    @Column(name = "fonte_recursos")
    private String fonteRecursos;

    // --- RELACIONAMENTO (Chave Estrangeira) ---
    // O CascadeType.PERSIST permite salvar um Credor novo junto com a Despesa se ele não existir
    @ManyToOne(cascade = CascadeType.PERSIST) 
    @JoinColumn(name = "credor_id")
    private CredorEntity credor;

    // --- Valores (Ciclo de Vida) ---
    @Column(name = "valor_empenhado")
    private BigDecimal valorEmpenhado;

    @Column(name = "valor_liquidado")
    private BigDecimal valorLiquidado;

    @Column(name = "valor_pago")
    private BigDecimal valorPago;

    // --- Detalhes ---
    @Column(name = "historico_objetivo", columnDefinition = "TEXT")
    private String historico; // O que foi comprado?

    @Column(name = "modalidade_licitacao")
    private String modalidadeLicitacao; // Ex: Pregão 05/2025
}