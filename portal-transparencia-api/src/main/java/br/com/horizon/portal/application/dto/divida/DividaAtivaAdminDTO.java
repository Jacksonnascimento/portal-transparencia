package br.com.horizon.portal.application.dto.divida;

import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record DividaAtivaAdminDTO(
        Long id,
        String nomeDevedor,
        String cpfCnpj,
        BigDecimal valorTotalDivida,
        Integer anoInscricao,
        String tipoDivida,
        LocalDateTime dataImportacao,
        String idImportacao
) {
    public static DividaAtivaAdminDTO fromEntity(DividaAtivaEntity entity) {
        return DividaAtivaAdminDTO.builder()
                .id(entity.getId())
                .nomeDevedor(entity.getNomeDevedor())
                .cpfCnpj(entity.getCpfCnpj()) // No Admin, enviamos o CPF/CNPJ sem máscara
                .valorTotalDivida(entity.getValorTotalDivida())
                .anoInscricao(entity.getAnoInscricao())
                .tipoDivida(entity.getTipoDivida())
                .dataImportacao(entity.getDataImportacao())
                .idImportacao(entity.getIdImportacao())
                .build();
    }
}