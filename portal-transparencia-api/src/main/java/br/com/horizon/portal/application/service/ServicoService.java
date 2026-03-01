package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ServicoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ServicoRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ServicoService {

    private final ServicoRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public ServicoService(ServicoRepository repository, ApplicationEventPublisher eventPublisher, ObjectMapper objectMapper) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    // --- MÉTODOS PÚBLICOS (Portal da Transparência) ---

    public List<ServicoEntity> listarAtivosParaPortal(String termoBusca) {
        if (termoBusca == null || termoBusca.trim().isEmpty()) {
            return repository.findAllByStatusOrderByNomeAsc(ServicoEntity.StatusServico.ATIVO);
        }
        // A query buscarServicosAtivos deve estar definida no Repository com LOWER/LIKE
        return repository.buscarServicosAtivos(ServicoEntity.StatusServico.ATIVO, termoBusca.trim());
    }

    // --- MÉTODOS PRIVADOS (Retaguarda / Admin) ---

    public List<ServicoEntity> listarTodos() {
        return repository.findAll();
    }

    @Transactional
    public ServicoEntity criar(ServicoEntity entity) {
        ServicoEntity salvo = repository.save(entity);
        // Criação: dadosAnteriores é null
        dispararAuditoria("CRIACAO", salvo.getId().toString(), null, salvo);
        return salvo;
    }

    @Transactional
    public ServicoEntity atualizar(UUID id, ServicoEntity dadosNovos) {
        ServicoEntity existente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));

        // RESOLUÇÃO DO WARNING: Uso do TypeReference para garantir segurança de tipos
        Map<String, Object> estadoAnterior = objectMapper.convertValue(
            existente, 
            new TypeReference<Map<String, Object>>() {}
        );

        // Atualiza os campos
        existente.setNome(dadosNovos.getNome());
        existente.setDescricao(dadosNovos.getDescricao());
        existente.setSetorResponsavel(dadosNovos.getSetorResponsavel());
        existente.setRequisitos(dadosNovos.getRequisitos());
        existente.setEtapas(dadosNovos.getEtapas());
        existente.setPrazoMaximo(dadosNovos.getPrazoMaximo());
        existente.setFormaPrestacao(dadosNovos.getFormaPrestacao());
        existente.setDetalhesPrestacao(dadosNovos.getDetalhesPrestacao());
        existente.setCanaisManifestacao(dadosNovos.getCanaisManifestacao());
        existente.setStatus(dadosNovos.getStatus());

        ServicoEntity salvo = repository.save(existente);
        
        // Dispara auditoria com estado anterior e novo
        dispararAuditoria("ATUALIZACAO", salvo.getId().toString(), estadoAnterior, salvo);
        return salvo;
    }

    /**
     * Dispara o evento de auditoria conforme a assinatura da sua classe LogAuditoriaEvent:
     * (acao, entidade, entidadeId, dadosAnteriores, dadosNovos)
     */
    private void dispararAuditoria(String acao, String entidadeId, Object dadosAnteriores, Object dadosNovos) {
        try {
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    acao,
                    "CARTA_SERVICOS", // Nome da entidade para o log
                    entidadeId,
                    dadosAnteriores,
                    dadosNovos
            ));
        } catch (Exception e) {
            // Log de erro para não travar a transação principal por falha na auditoria
            System.err.println("Erro ao publicar evento de auditoria: " + e.getMessage());
        }
    }
}