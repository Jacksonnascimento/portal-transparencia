package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tb_divida_ativa")
public class DividaAtivaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_devedor", nullable = false)
    private String nomeDevedor;

    @Column(name = "cpf_cnpj", length = 20)
    private String cpfCnpj;

    @Column(name = "valor_total_divida", nullable = false)
    private BigDecimal valorTotalDivida;

    @Column(name = "ano_inscricao", nullable = false)
    private Integer anoInscricao;

    @Column(name = "tipo_divida", length = 100)
    private String tipoDivida;

    // --- Trilha de Auditoria e Ingestão ---
    @Column(name = "data_importacao")
    private LocalDateTime dataImportacao = LocalDateTime.now();

    @Column(name = "id_importacao")
    private String idImportacao;
}