package br.com.horizon.portal.infrastructure.adapter.in.rest.dto;

import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DespesaResponse {
    private String empenho;
    private LocalDate data;
    private String orgao;
    private String credorNome;
    private String credorDocumento;
    private BigDecimal empenhado;
    private BigDecimal liquidado;
    private BigDecimal pago;
    private String historico;

    public static DespesaResponse fromEntity(DespesaEntity entity) {
        DespesaResponse dto = new DespesaResponse();
        dto.setEmpenho(entity.getNumeroEmpenho());
        dto.setData(entity.getDataEmpenho());
        dto.setOrgao(entity.getOrgaoNome());
        if (entity.getCredor() != null) {
            dto.setCredorNome(entity.getCredor().getRazaoSocial());
            dto.setCredorDocumento(entity.getCredor().getCpfCnpj());
        }
        dto.setEmpenhado(entity.getValorEmpenhado());
        dto.setLiquidado(entity.getValorLiquidado());
        dto.setPago(entity.getValorPago());
        dto.setHistorico(entity.getHistorico());
        return dto;
    }
}