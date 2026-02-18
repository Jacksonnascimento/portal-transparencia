package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tb_receita")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceitaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Dados Temporais ---
    @Column(nullable = false)
    private Integer exercicio; // Ano (2025)

    @Column(nullable = false)
    private Integer mes; // Mês (1 a 12)

    @Column(name = "data_lancamento", nullable = false)
    private LocalDate dataLancamento;

    // --- Classificação Orçamentária (A Árvore Contábil) ---
    
    @Column(name = "categoria_economica", nullable = false, length = 100)
    private String categoriaEconomica; // Ex: Receitas Correntes

    @Column(nullable = false, length = 100)
    private String origem; // Ex: Impostos, Taxas

    @Column(length = 150)
    private String especie; // Ex: Impostos sobre o Patrimônio

    @Column(length = 150)
    private String rubrica; // Ex: IPTU

    @Column(length = 150)
    private String alinea; // Ex: IPTU - Principal

    @Column(name = "fonte_recursos", nullable = false, length = 100)
    private String fonteRecursos; // Ex: Recursos Ordinários (Fundamental para TCE)

    // --- Valores (Planejado vs Realizado) ---

    @Column(name = "valor_previsto_inicial", precision = 19, scale = 2)
    private BigDecimal valorPrevistoInicial; // O que estava na LOA

    @Column(name = "valor_previsto_atualizado", precision = 19, scale = 2)
    private BigDecimal valorPrevistoAtualizado; // O que vale hoje

    @Column(name = "valor_arrecadado", nullable = false, precision = 19, scale = 2)
    private BigDecimal valorArrecadado; // O dinheiro que entrou

    // --- Transparência Ativa ---
    
    @Column(columnDefinition = "TEXT")
    private String historico; // Descrição detalhada do lançamento
}