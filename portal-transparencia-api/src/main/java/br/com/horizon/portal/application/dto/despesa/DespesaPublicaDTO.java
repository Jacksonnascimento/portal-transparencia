package br.com.horizon.portal.application.dto.despesa;

import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record DespesaPublicaDTO(
        Integer exercicio,
        String numeroEmpenho,
        String numeroProcessoPagamento, // NOVO
        LocalDate dataEmpenho,
        String orgaoNome,
        String unidadeNome,             // NOVO
        String credorNome,
        String credorDocumento,
        String funcao,                  // NOVO
        String subfuncao,               // NOVO
        String programa,                // NOVO
        String acaoGoverno,             // NOVO
        String elementoDespesa,
        String fonteRecursos,           // NOVO
        String modalidadeLicitacao,     // NOVO
        String historicoObjetivo,       // NOVO
        BigDecimal valorEmpenhado,
        BigDecimal valorLiquidado,
        LocalDate dataLiquidacao,       // NOVO
        BigDecimal valorPago,
        LocalDate dataPagamento          // NOVO
) {
    public static DespesaPublicaDTO fromEntity(DespesaEntity entity) {
        String credorNome = entity.getCredor() != null ? entity.getCredor().getRazaoSocial() : "NÃO INFORMADO";
        String doc = entity.getCredor() != null ? entity.getCredor().getCpfCnpj() : "";

        if (doc != null && doc.length() == 11) {
            doc = "***." + doc.substring(3, 6) + ".***-**";
        }

        return DespesaPublicaDTO.builder()
                .exercicio(entity.getExercicio())
                .numeroEmpenho(entity.getNumeroEmpenho())
                .numeroProcessoPagamento(entity.getNumeroProcessoPagamento())
                .dataEmpenho(entity.getDataEmpenho())
                .orgaoNome(entity.getOrgaoNome())
                .unidadeNome(entity.getUnidadeNome())
                .credorNome(credorNome)
                .credorDocumento(doc)
                .funcao(entity.getFuncao())
                .subfuncao(entity.getSubfuncao())
                .programa(entity.getPrograma())
                .acaoGoverno(entity.getAcaoGoverno())
                .elementoDespesa(entity.getElementoDespesa())
                .fonteRecursos(entity.getFonteRecursos())
                .modalidadeLicitacao(entity.getModalidadeLicitacao())
                .historicoObjetivo(entity.getHistoricoObjetivo())
                .valorEmpenhado(entity.getValorEmpenhado() != null ? entity.getValorEmpenhado() : BigDecimal.ZERO)
                .valorLiquidado(entity.getValorLiquidado() != null ? entity.getValorLiquidado() : BigDecimal.ZERO)
                .dataLiquidacao(entity.getDataLiquidacao())
                .valorPago(entity.getValorPago() != null ? entity.getValorPago() : BigDecimal.ZERO)
                .dataPagamento(entity.getDataPagamento())
                .build();
    }
}