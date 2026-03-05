package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.sic.SicEstatisticasDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoRequestDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoResponseDTO;
import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import br.com.horizon.portal.infrastructure.persistence.repository.SicSolicitacaoRepository;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class SicSolicitacaoService {

    private final SicSolicitacaoRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    /**
     * ROTA PÚBLICA: Criação do pedido pelo Cidadão.
     * Gera protocolo único e dispara e-mail de confirmação.
     */
    @Transactional
    public SicSolicitacaoResponseDTO criarSolicitacao(SicSolicitacaoRequestDTO dto) {
        String protocoloGerado = gerarProtocoloUnico();

        SicSolicitacaoEntity novaSolicitacao = SicSolicitacaoEntity.builder()
                .protocolo(protocoloGerado)
                .nome(dto.getNome())
                .documento(dto.getDocumento().replaceAll("\\D", ""))
                .email(dto.getEmail())
                .tipoSolicitacao(dto.getTipoSolicitacao())
                .mensagem(dto.getMensagem())
                .urlAnexoSolicitacao(dto.getUrlAnexoSolicitacao())
                .sigilo(dto.getSigilo())
                .status(SicStatus.RECEBIDO)
                .build();

        novaSolicitacao = repository.save(novaSolicitacao);

        // Notifica o cidadão via e-mail (Assíncrono)
        emailService.enviarEmailSic(
            novaSolicitacao.getEmail(), 
            "Confirmação de Abertura de Protocolo - e-SIC", 
            "Olá " + novaSolicitacao.getNome() + ",\n\nSua solicitação foi registrada com sucesso.\nProtocolo: " + protocoloGerado + "\n\nVocê pode acompanhar o andamento pelo Portal da Transparência."
        );

        return mapearParaResponse(novaSolicitacao);
    }

    /**
     * ROTA PÚBLICA: Consulta de andamento pelo Cidadão.
     */
    @Transactional(readOnly = true)
    public SicSolicitacaoResponseDTO consultarProtocolo(String protocolo, String documento) {
        String documentoLimpo = documento.replaceAll("\\D", "");
        
        SicSolicitacaoEntity entity = repository.findByProtocoloAndDocumento(protocolo, documentoLimpo)
                .orElseThrow(() -> new RuntimeException("Protocolo não encontrado ou documento inválido."));

        return mapearParaResponse(entity);
    }

    /**
     * ROTA PRIVADA (ADMIN): Servidor público respondendo ou tramitando o pedido.
     * Realiza auditoria completa e notifica o cidadão em caso de finalização.
     */
    @Transactional
    public void tramitarSolicitacao(Long id, SicStatus novoStatus, String resposta, String urlAnexo, Long usuarioId) {
        SicSolicitacaoEntity solicitacao = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));

        String estadoAnteriorJson = converterParaJson(solicitacao);

        // Atualiza a entidade
        solicitacao.setStatus(novoStatus);
        solicitacao.setUsuarioRespostaId(usuarioId);
        
        if (resposta != null && !resposta.isBlank()) {
            solicitacao.setRespostaOficial(resposta);
            solicitacao.setDataResposta(LocalDateTime.now());
            solicitacao.setUrlAnexoResposta(urlAnexo);
        }

        SicSolicitacaoEntity solicitacaoSalva = repository.save(solicitacao);
        String novoEstadoJson = converterParaJson(solicitacaoSalva);

        // Dispara Auditoria OBRIGATÓRIA
        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "ATUALIZACAO",
                "tb_sic_solicitacao",
                String.valueOf(solicitacaoSalva.getId()),
                estadoAnteriorJson,
                novoEstadoJson
        ));

        // Se finalizado, avisa o cidadão
        if (novoStatus == SicStatus.RESPONDIDO || novoStatus == SicStatus.NEGADO) {
            emailService.enviarEmailSic(
                solicitacaoSalva.getEmail(),
                "Atualização no seu Protocolo e-SIC",
                "Atenção " + solicitacaoSalva.getNome() + ",\n\nSeu protocolo " + solicitacaoSalva.getProtocolo() + " recebeu uma resposta oficial.\n\nAcesse o Portal para visualizar os detalhes."
            );
        }
    }

    /**
     * ROTA PÚBLICA: Cidadão entra com recurso caso discorde da resposta.
     */
    @Transactional
    public void entrarComRecurso(String protocolo, String documento, String justificativa) {
        String documentoLimpo = documento.replaceAll("\\D", "");
        SicSolicitacaoEntity entity = repository.findByProtocoloAndDocumento(protocolo, documentoLimpo)
                .orElseThrow(() -> new RuntimeException("Protocolo não localizado para recurso."));

        if (entity.getStatus() != SicStatus.RESPONDIDO && entity.getStatus() != SicStatus.NEGADO) {
            throw new RuntimeException("Só é possível entrar com recurso em protocolos finalizados.");
        }

        String estadoAnterior = converterParaJson(entity);
        entity.setStatus(SicStatus.RECURSO_SOLICITADO);
        entity.setMensagem(entity.getMensagem() + "\n\n--- RECURSO DO CIDADÃO ---\n" + justificativa);
        
        repository.save(entity);

        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "SOLICITACAO_RECURSO",
                "tb_sic_solicitacao",
                entity.getId().toString(),
                estadoAnterior,
                converterParaJson(entity)
            ));
    }

    /**
     * ESTATÍSTICAS: Para o Selo Ouro do PNTP.
     */
    public SicEstatisticasDTO obterEstatisticas() {
        List<SicSolicitacaoEntity> todos = repository.findAll();
        
        long respondidos = todos.stream().filter(s -> s.getStatus() == SicStatus.RESPONDIDO).count();
        long emAberto = todos.stream().filter(s -> s.getStatus() == SicStatus.RECEBIDO || s.getStatus() == SicStatus.EM_ANALISE).count();
        long negados = todos.stream().filter(s -> s.getStatus() == SicStatus.NEGADO).count();

        double tempoMedio = todos.stream()
                .filter(s -> s.getDataResposta() != null)
                .mapToLong(s -> Duration.between(s.getDataSolicitacao(), s.getDataResposta()).toDays())
                .average()
                .orElse(0.0);

        return SicEstatisticasDTO.builder()
                .totalPedidos(todos.size())
                .pedidosRespondidos(respondidos)
                .pedidosEmAberto(emAberto)
                .pedidosNegados(negados)
                .tempoMedioRespostaDias(tempoMedio)
                .build();
    }

    // ================= MÉTODOS AUXILIARES PRIVADOS ================= //

    private String gerarProtocoloUnico() {
        int anoAtual = Year.now().getValue();
        Random random = new Random();
        String protocolo;
        do {
            int numeroAleatorio = 100000 + random.nextInt(900000); 
            protocolo = "SIC-" + anoAtual + "-" + numeroAleatorio;
        } while (repository.existsByProtocolo(protocolo));
        return protocolo;
    }

    private String converterParaJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Erro ao converter objeto para auditoria", e);
            return "{}";
        }
    }

    private SicSolicitacaoResponseDTO mapearParaResponse(SicSolicitacaoEntity entity) {
        return SicSolicitacaoResponseDTO.builder()
                .protocolo(entity.getProtocolo())
                .status(entity.getStatus())
                .dataSolicitacao(entity.getDataSolicitacao())
                .respostaOficial(entity.getRespostaOficial())
                .urlAnexoResposta(entity.getUrlAnexoResposta())
                .dataResposta(entity.getDataResposta())
                .justificativaProrrogacao(entity.getJustificativaProrrogacao())
                .build();
    }
}