package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tb_receita")
@Data // Lombok: Gera Getters, Setters, Equals, HashCode automaticamente
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceitaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer exercicio; // Ano (ex: 2025)

    @Column(nullable = false)
    private Integer mes;

    @Column(name = "data_lancamento")
    private LocalDate dataLancamento;

    // Classificação Orçamentária
    @Column(name = "categoria_economica", nullable = false)
    private String categoriaEconomica;

    @Column(nullable = false)
    private String origem;

    private String especie;
    private String rubrica;
    private String alinea;

    @Column(name = "fonte_recursos", nullable = false)
    private String fonteRecursos;

    // Valores Monetários (BigDecimal é obrigatório para dinheiro)
    @Column(name = "valor_previsto_inicial")
    private BigDecimal valorPrevistoInicial;

    @Column(name = "valor_previsto_atualizado")
    private BigDecimal valorPrevistoAtualizado;

    @Column(name = "valor_arrecadado", nullable = false)
    private BigDecimal valorArrecadado;

    @Column(columnDefinition = "TEXT")
    private String historico;
}