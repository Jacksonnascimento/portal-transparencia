package br.com.horizon.portal.application.dto.diarias;

import br.com.horizon.portal.infrastructure.persistence.entity.DiariaPassagemEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DiariaPassagemDTO {

    // O que entra na API (Cadastro/Atualização pelo Retaguarda)
    record Request(
            @NotNull(message = "O exercício é obrigatório") 
            Integer exercicio,
            
            Long orgaoId,
            
            @NotBlank(message = "O nome do favorecido é obrigatório") 
            String nomeFavorecido,
            
            String cargoFavorecido,
            String cpfCnpjFavorecido,
            
            @NotBlank(message = "O destino é obrigatório") 
            String destinoViagem,
            
            @NotBlank(message = "O motivo da viagem é obrigatório") 
            String motivoViagem,
            
            @NotNull(message = "A data de saída é obrigatória") 
            LocalDate dataSaida,
            
            @NotNull(message = "A data de retorno é obrigatória") 
            LocalDate dataRetorno,
            
            BigDecimal quantidadeDiarias,
            BigDecimal valorDiarias,
            BigDecimal valorPassagens,
            BigDecimal valorDevolvido,
            String numeroProcesso,
            String portariaConcessao
    ) {}

    // O que sai da API (Leitura no Portal Público e no Retaguarda)
    record Response(
            Long id,
            Integer exercicio,
            Long orgaoId,
            String nomeFavorecido,
            String cargoFavorecido,
            String cpfCnpjFavorecido,
            String destinoViagem,
            String motivoViagem,
            LocalDate dataSaida,
            LocalDate dataRetorno,
            BigDecimal quantidadeDiarias,
            BigDecimal valorDiarias,
            BigDecimal valorPassagens,
            BigDecimal valorDevolvido,
            BigDecimal valorTotal, // Calculado pelo banco
            String numeroProcesso,
            String portariaConcessao,
            Boolean ativo
    ) {
        // Método de fábrica para converter a Entidade em DTO rapidamente
        public static Response fromEntity(DiariaPassagemEntity entity) {
            return new Response(
                    entity.getId(),
                    entity.getExercicio(),
                    entity.getOrgaoId(),
                    entity.getNomeFavorecido(),
                    entity.getCargoFavorecido(),
                    entity.getCpfCnpjFavorecido(),
                    entity.getDestinoViagem(),
                    entity.getMotivoViagem(),
                    entity.getDataSaida(),
                    entity.getDataRetorno(),
                    entity.getQuantidadeDiarias(),
                    entity.getValorDiarias(),
                    entity.getValorPassagens(),
                    entity.getValorDevolvido(),
                    entity.getValorTotal(),
                    entity.getNumeroProcesso(),
                    entity.getPortariaConcessao(),
                    entity.getAtivo()
            );
        }
    }
}