package br.com.horizon.portal.application.dto.config;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;

public class ConfiguracaoDTO {

    public record Response(
            String nomeEntidade,
            String cnpj,
            String urlBrasao,
            String corPrincipal,
            String endereco,
            String telefone,
            String horarioAtendimento
    ) {
        public static Response fromEntity(ConfiguracaoEntity e) {
            return new Response(
                e.getNomeEntidade(), e.getCnpj(), e.getUrlBrasao(),
                e.getCorPrincipal(), e.getEndereco(), e.getTelefone(), e.getHorarioAtendimento()
            );
        }
    }

    public record Update(
            String nomeEntidade,
            String cnpj,
            String corPrincipal,
            String endereco,
            String telefone,
            String horarioAtendimento
    ) {}
}