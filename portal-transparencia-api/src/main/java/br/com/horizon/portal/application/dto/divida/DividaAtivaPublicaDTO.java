package br.com.horizon.portal.application.dto.divida;

import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record DividaAtivaPublicaDTO(
        String nomeDevedor,
        String cpfCnpj,
        BigDecimal valorTotalDivida,
        Integer anoInscricao,
        String tipoDivida
) {
    public static DividaAtivaPublicaDTO fromEntity(DividaAtivaEntity entity) {
        String doc = entity.getCpfCnpj() != null ? entity.getCpfCnpj() : "";

        // Mascara CPF para LGPD (Vitrine Pública)
        if (doc.length() == 11) {
            doc = "***." + doc.substring(3, 6) + ".***-**";
        }

        return DividaAtivaPublicaDTO.builder()
                .nomeDevedor(entity.getNomeDevedor())
                .cpfCnpj(doc)
                .valorTotalDivida(entity.getValorTotalDivida() != null ? entity.getValorTotalDivida() : BigDecimal.ZERO)
                .anoInscricao(entity.getAnoInscricao())
                .tipoDivida(entity.getTipoDivida())
                .build();
    }
}