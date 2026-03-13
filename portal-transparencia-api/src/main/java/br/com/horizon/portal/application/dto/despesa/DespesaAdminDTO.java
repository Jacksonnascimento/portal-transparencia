package br.com.horizon.portal.application.dto.despesa;

import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record DespesaAdminDTO(
        Long id,
        String idImportacao,
        Integer exercicio,
        String numeroEmpenho,
        String numeroProcessoPagamento, // NOVO
        LocalDate dataEmpenho,
        String orgaoCodigo,             // NOVO
        String orgaoNome,
        String unidadeCodigo,           // NOVO
        String unidadeNome,
        String funcao,
        String subfuncao,
        String programa,
        String acaoGoverno,             // NOVO
        String elementoDespesa,
        String fonteRecursos,
        String historicoObjetivo,
        String modalidadeLicitacao,
        BigDecimal valorEmpenhado,
        BigDecimal valorLiquidado,
        LocalDate dataLiquidacao,
        BigDecimal valorPago,
        LocalDate dataPagamento,
        CredorResumoDTO credor
) {
    public static DespesaAdminDTO fromEntity(DespesaEntity entity) {
        CredorResumoDTO credorResumo = entity.getCredor() != null 
                ? new CredorResumoDTO(entity.getCredor().getRazaoSocial(), entity.getCredor().getCpfCnpj()) 
                : null;

        return DespesaAdminDTO.builder()
                .id(entity.getId())
                .idImportacao(entity.getIdImportacao())
                .exercicio(entity.getExercicio())
                .numeroEmpenho(entity.getNumeroEmpenho())
                .numeroProcessoPagamento(entity.getNumeroProcessoPagamento())
                .dataEmpenho(entity.getDataEmpenho())
                .orgaoCodigo(entity.getOrgaoCodigo())
                .orgaoNome(entity.getOrgaoNome())
                .unidadeCodigo(entity.getUnidadeCodigo())
                .unidadeNome(entity.getUnidadeNome())
                .funcao(entity.getFuncao())
                .subfuncao(entity.getSubfuncao())
                .programa(entity.getPrograma())
                .acaoGoverno(entity.getAcaoGoverno())
                .elementoDespesa(entity.getElementoDespesa())
                .fonteRecursos(entity.getFonteRecursos())
                .historicoObjetivo(entity.getHistoricoObjetivo())
                .modalidadeLicitacao(entity.getModalidadeLicitacao())
                .valorEmpenhado(entity.getValorEmpenhado())
                .valorLiquidado(entity.getValorLiquidado())
                .dataLiquidacao(entity.getDataLiquidacao())
                .valorPago(entity.getValorPago())
                .dataPagamento(entity.getDataPagamento())
                .credor(credorResumo)
                .build();
    }

    public record CredorResumoDTO(String razaoSocial, String cpfCnpj) {}
}