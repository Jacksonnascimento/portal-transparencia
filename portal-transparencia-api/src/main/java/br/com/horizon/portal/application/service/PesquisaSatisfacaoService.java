package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.sic.PesquisaSatisfacaoRequestDTO;
import br.com.horizon.portal.infrastructure.persistence.entity.PesquisaSatisfacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.PesquisaSatisfacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PesquisaSatisfacaoService {

    private final PesquisaSatisfacaoRepository repository;

    @Transactional
    public void registrarAvaliacao(PesquisaSatisfacaoRequestDTO dto) {
        PesquisaSatisfacaoEntity entidade = PesquisaSatisfacaoEntity.builder()
                .nota(dto.getNota())
                .comentario(dto.getComentario())
                .moduloAvaliado(dto.getModuloAvaliado())
                .build();

        repository.save(entidade);
    }
    
    // O endpoint de estatísticas agregadas (Média de notas) que você pediu 
    // será construído depois em uma Query nativa ou DTO específico para o Front-end.
}