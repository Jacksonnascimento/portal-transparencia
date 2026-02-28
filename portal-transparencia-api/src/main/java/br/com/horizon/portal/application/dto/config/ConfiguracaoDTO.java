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
            String horarioAtendimento,
            String siteOficial,
            String diarioOficial,
            String portalContribuinte,
            String facebook,
            String instagram,
            String twitter,
            // Novos campos
            String emailEntidade,
            String linkOuvidoria,
            String telefoneOuvidoria,
            String emailOuvidoria,
            String politicaPrivacidade,
            String termosUso
    ) {
        public static Response fromEntity(ConfiguracaoEntity e) {
            return new Response(
                e.getNomeEntidade(), e.getCnpj(), e.getUrlBrasao(),
                e.getCorPrincipal(), e.getEndereco(), e.getTelefone(), e.getHorarioAtendimento(),
                e.getSiteOficial(), e.getDiarioOficial(), e.getPortalContribuinte(),
                e.getFacebook(), e.getInstagram(), e.getTwitter(),
                e.getEmailEntidade(), e.getLinkOuvidoria(), e.getTelefoneOuvidoria(), e.getEmailOuvidoria(),
                e.getPoliticaPrivacidade(),
                e.getTermosUso()
            );
        }
    }

    public record Update(
            String nomeEntidade,
            String cnpj,
            String corPrincipal,
            String endereco,
            String telefone,
            String horarioAtendimento,
            String siteOficial,
            String diarioOficial,
            String portalContribuinte,
            String facebook,
            String instagram,
            String twitter,
            
            String emailEntidade,
            String linkOuvidoria,
            String telefoneOuvidoria,
            String emailOuvidoria,
            String politicaPrivacidade,
            String termosUso
    ) {}
}