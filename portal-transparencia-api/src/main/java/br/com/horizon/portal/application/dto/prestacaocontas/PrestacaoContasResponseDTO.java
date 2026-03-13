package br.com.horizon.portal.application.dto.prestacaocontas;

import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrestacaoContasResponseDTO {
    private UUID id;
    private TipoRelatorio tipoRelatorio;
    private Integer exercicio;
    private Integer periodo;
    private TipoPeriodo tipoPeriodo;
    private LocalDate dataPublicacao;
    private String arquivoPdfUrl;
    private String arquivoNome;
}