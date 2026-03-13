package br.com.horizon.portal.infrastructure.persistence.entity;

import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prestacao_contas")
public class PrestacaoContasEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_relatorio", nullable = false, length = 50)
    private TipoRelatorio tipoRelatorio;

    @Column(name = "exercicio", nullable = false)
    private Integer exercicio;

    @Column(name = "periodo")
    private Integer periodo; // Pode ser nulo quando o relatório for Anual (Balanço Geral)

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_periodo", nullable = false, length = 50)
    private TipoPeriodo tipoPeriodo;

    @Column(name = "data_publicacao", nullable = false)
    private LocalDate dataPublicacao;

    @Column(name = "arquivo_pdf_url", nullable = false, length = 500)
    private String arquivoPdfUrl;

    @Column(name = "arquivo_nome", nullable = false, length = 255)
    private String arquivoNome;

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
        this.dataAtualizacao = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}