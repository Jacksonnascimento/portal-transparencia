package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_diarias_passagens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class DiariaPassagemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer exercicio;

    @Column(name = "orgao_id")
    private Long orgaoId;

    @Column(name = "nome_favorecido", nullable = false)
    private String nomeFavorecido;

    @Column(name = "cargo_favorecido")
    private String cargoFavorecido;

    @Column(name = "cpf_cnpj_favorecido", length = 20)
    private String cpfCnpjFavorecido;

    @Column(name = "destino_viagem", nullable = false)
    private String destinoViagem;

    @Column(name = "motivo_viagem", columnDefinition = "TEXT", nullable = false)
    private String motivoViagem;

    @Column(name = "data_saida", nullable = false)
    private LocalDate dataSaida;

    @Column(name = "data_retorno", nullable = false)
    private LocalDate dataRetorno;

    @Column(name = "quantidade_diarias", precision = 5, scale = 2)
    private BigDecimal quantidadeDiarias;

    @Column(name = "valor_diarias", precision = 15, scale = 2)
    private BigDecimal valorDiarias;

    @Column(name = "valor_passagens", precision = 15, scale = 2)
    private BigDecimal valorPassagens;

    @Column(name = "valor_devolvido", precision = 15, scale = 2)
    private BigDecimal valorDevolvido;

    // O valorTotal é gerado no banco de dados (STORED), então usamos updatable e insertable = false
    @Column(name = "valor_total", precision = 15, scale = 2, insertable = false, updatable = false)
    private BigDecimal valorTotal;

    @Column(name = "numero_processo", length = 50)
    private String numeroProcesso;

    @Column(name = "portaria_concessao", length = 50)
    private String portariaConcessao;

    // CORREÇÃO AQUI: @Builder.Default para o Lombok não ignorar o valor padrão
    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @UpdateTimestamp
    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;
    
    // Método utilitário para "Soft Delete" (exigência de auditoria em licitações)
    public void inativar() {
        this.ativo = false;
    }
}