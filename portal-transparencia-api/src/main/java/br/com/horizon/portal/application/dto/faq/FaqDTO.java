package br.com.horizon.portal.application.dto.faq;

import br.com.horizon.portal.infrastructure.persistence.entity.FaqEntity;

public class FaqDTO {

    public record Request(
            String pergunta,
            String resposta,
            Boolean ativo,
            Integer ordem
    ) {}

    public record Response(
            Long id,
            String pergunta,
            String resposta,
            Boolean ativo,
            Integer ordem
    ) {
        public static Response fromEntity(FaqEntity entity) {
            return new Response(
                    entity.getId(),
                    entity.getPergunta(),
                    entity.getResposta(),
                    entity.getAtivo(),
                    entity.getOrdem()
            );
        }
    }
}