package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.faq.FaqDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.FaqEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FaqService {

    private final FaqRepository repository;
    private final ApplicationEventPublisher eventPublisher;

    // --- MÉTODOS PARA A RETAGUARDA (ADMIN) ---

    public Page<FaqDTO.Response> listarTodosAdmin(String busca, Pageable pageable) {
        if (busca != null && !busca.trim().isEmpty()) {
            return repository.buscarTodosAdminPorPalavraChave(busca, pageable).map(FaqDTO.Response::fromEntity);
        }
        return repository.findAll(pageable).map(FaqDTO.Response::fromEntity);
    }

    @Transactional
    public FaqDTO.Response criar(FaqDTO.Request dto) {
        FaqEntity entity = FaqEntity.builder()
                .pergunta(dto.pergunta())
                .resposta(dto.resposta())
                .ativo(dto.ativo() != null ? dto.ativo() : true)
                .ordem(dto.ordem() != null ? dto.ordem() : 0)
                .build();

        entity = repository.save(entity);
        FaqDTO.Response response = FaqDTO.Response.fromEntity(entity);

        // Auditoria
        eventPublisher.publishEvent(new LogAuditoriaEvent("CRIACAO", "FAQ", entity.getId().toString(), null, response));

        return response;
    }

    @Transactional
    public FaqDTO.Response atualizar(Long id, FaqDTO.Request dto) {
        FaqEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ não encontrado."));

        FaqDTO.Response estadoAnterior = FaqDTO.Response.fromEntity(entity);

        entity.setPergunta(dto.pergunta());
        entity.setResposta(dto.resposta());
        if (dto.ativo() != null) entity.setAtivo(dto.ativo());
        if (dto.ordem() != null) entity.setOrdem(dto.ordem());

        entity = repository.save(entity);
        FaqDTO.Response estadoNovo = FaqDTO.Response.fromEntity(entity);

        // Auditoria
        eventPublisher.publishEvent(new LogAuditoriaEvent("ATUALIZACAO", "FAQ", entity.getId().toString(), estadoAnterior, estadoNovo));

        return estadoNovo;
    }

    @Transactional
    public void excluir(Long id) {
        FaqEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ não encontrado."));
        
        FaqDTO.Response estadoAnterior = FaqDTO.Response.fromEntity(entity);
        repository.delete(entity);

        // Auditoria
        eventPublisher.publishEvent(new LogAuditoriaEvent("EXCLUSAO", "FAQ", id.toString(), estadoAnterior, null));
    }

    // --- MÉTODOS PARA O PORTAL PÚBLICO ---

    public Page<FaqDTO.Response> listarPublico(String busca, Pageable pageable) {
        if (busca != null && !busca.trim().isEmpty()) {
            return repository.buscarAtivosPorPalavraChave(busca, pageable).map(FaqDTO.Response::fromEntity);
        }
        return repository.findByAtivoTrueOrderByOrdemAsc(pageable).map(FaqDTO.Response::fromEntity);
    }
}