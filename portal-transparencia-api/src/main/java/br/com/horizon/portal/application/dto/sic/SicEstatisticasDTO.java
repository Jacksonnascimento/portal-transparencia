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
    private long pedidosEmAlerta;    // Faltando 3 dias ou menos
    private long pedidosExpirados;   // Passou do prazo legal
    private double tempoMedioRespostaDias;

    // NOVOS CAMPOS: Satisfação do Cidadão (Selo Ouro PNTP)
    private double notaMedia;            // Média de 1 a 5
    private double percentualAprovacao;  // % de notas 4 e 5
    private long totalAvaliacoes;        // Base de cálculo
}