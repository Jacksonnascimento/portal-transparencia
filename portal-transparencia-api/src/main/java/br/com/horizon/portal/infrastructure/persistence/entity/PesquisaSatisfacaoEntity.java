package br.com.horizon.portal.infrastructure.persistence.entity;

import br.com.horizon.portal.infrastructure.persistence.enums.ModuloAvaliado;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_pesquisa_satisfacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PesquisaSatisfacaoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer nota;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @Enumerated(EnumType.STRING)
    @Column(name = "modulo_avaliado", nullable = false)
    private ModuloAvaliado moduloAvaliado;

    @CreationTimestamp
    @Column(name = "data_avaliacao", updatable = false)
    private LocalDateTime dataAvaliacao;
}