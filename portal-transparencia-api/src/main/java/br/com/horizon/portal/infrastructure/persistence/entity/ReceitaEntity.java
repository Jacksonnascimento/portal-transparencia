package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp; // IMPORTANTE ADICIONAR

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime; // IMPORTANTE ADICIONAR

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

    // --- Classificação Orçamentária ---
    
    @Column(name = "categoria_economica", nullable = false, length = 100)
    private String categoriaEconomica; 

    @Column(nullable = false, length = 100)
    private String origem; 

    @Column(length = 150)
    private String especie; 

    @Column(length = 150)
    private String rubrica; 

    @Column(length = 150)
    private String alinea; 

    @Column(name = "fonte_recursos", nullable = false, length = 100)
    private String fonteRecursos; 

    // --- Valores ---

    @Column(name = "valor_previsto_inicial", precision = 19, scale = 2)
    private BigDecimal valorPrevistoInicial; 

    @Column(name = "valor_previsto_atualizado", precision = 19, scale = 2)
    private BigDecimal valorPrevistoAtualizado; 

    @Column(name = "valor_arrecadado", nullable = false, precision = 19, scale = 2)
    private BigDecimal valorArrecadado; 

    // --- Transparência Ativa ---
    
    @Column(columnDefinition = "TEXT")
    private String historico; 

    // --- NOVO: Tempestividade (Exigência PNTP / Licitação) ---
    @CreationTimestamp
    @Column(name = "data_importacao", updatable = false)
    private LocalDateTime dataImportacao;

    //log - desfazer 

    @Column(name = "id_importacao")
    private String idImportacao;
}