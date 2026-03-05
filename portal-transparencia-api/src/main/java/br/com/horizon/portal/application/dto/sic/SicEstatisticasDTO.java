package br.com.horizon.portal.application.dto.sic;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SicEstatisticasDTO {
    private long totalPedidos;
    private long pedidosRespondidos;
    private long pedidosEmAberto;
    private long pedidosNegados;
    private double tempoMedioRespostaDias;
}