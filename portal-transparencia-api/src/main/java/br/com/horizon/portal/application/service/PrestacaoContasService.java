package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.prestacaocontas.PrestacaoContasRequestDTO;
import br.com.horizon.portal.application.dto.prestacaocontas.PrestacaoContasResponseDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.PrestacaoContasEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import br.com.horizon.portal.infrastructure.persistence.repository.PrestacaoContasRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrestacaoContasService {

    private final PrestacaoContasRepository repository;
    private final ArmazenamentoService armazenamentoService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    // Diretório blindado para nossos relatórios contábeis
    private static final String SUBPASTA_PRESTACAO = "prestacao-contas";

    public Page<PrestacaoContasResponseDTO> listar(
            TipoRelatorio tipoRelatorio, Integer exercicio, Integer periodo,
            TipoPeriodo tipoPeriodo, String termoBusca, Pageable pageable) {
        
        return repository.findComFiltros(tipoRelatorio, exercicio, periodo, tipoPeriodo, termoBusca, pageable)
                .map(this::toResponseDTO);
    }

    @Transactional
    public PrestacaoContasResponseDTO salvar(PrestacaoContasRequestDTO dto, MultipartFile file) {
        log.info("Iniciando upload de Prestação de Contas: {} - {}", dto.getTipoRelatorio(), dto.getExercicio());

        // 1. Validação de Segurança e Conformidade (PDF Pesquisável)
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de Prestação de Contas é obrigatório.");
        }
        
        String nomeOriginal = file.getOriginalFilename() != null ? file.getOriginalFilename() : "documento.pdf";
        if (!"application/pdf".equalsIgnoreCase(file.getContentType()) && !nomeOriginal.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Apenas arquivos no formato PDF são permitidos (Artigo de transparência exige PDF pesquisável).");
        }

        // 2. Salvar o arquivo fisicamente usando o nosso serviço padrão
        String urlArquivo = armazenamentoService.salvar(file, SUBPASTA_PRESTACAO);

        // 3. Montar e persistir a Entidade
        PrestacaoContasEntity entity = PrestacaoContasEntity.builder()
                .tipoRelatorio(dto.getTipoRelatorio())
                .exercicio(dto.getExercicio())
                .periodo(dto.getPeriodo())
                .tipoPeriodo(dto.getTipoPeriodo())
                .dataPublicacao(dto.getDataPublicacao())
                .arquivoPdfUrl(urlArquivo)
                .arquivoNome(nomeOriginal)
                .build();

        PrestacaoContasEntity salvo = repository.save(entity);

        // 4. Disparar Evento de Auditoria usando o motor padrão do sistema
        dispararLog("CRIACAO", salvo.getId().toString(), salvo, "Upload de documento: " + nomeOriginal);

        return toResponseDTO(salvo);
    }

    @Transactional
    public void excluir(UUID id) {
        PrestacaoContasEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Documento de Prestação de Contas não encontrado."));

        // 1. Apagar o arquivo físico usando a Lixeira Automática
        armazenamentoService.apagar(entity.getArquivoPdfUrl());

        // 2. Excluir do banco de dados
        repository.delete(entity);

        // 3. Registrar a ação destrutiva na Auditoria
        dispararLog("EXCLUSAO", entity.getId().toString(), entity, "Documento excluído: " + entity.getArquivoNome());
    }

    // --- Métodos Auxiliares de Mapeamento ---

    private PrestacaoContasResponseDTO toResponseDTO(PrestacaoContasEntity entity) {
        return PrestacaoContasResponseDTO.builder()
                .id(entity.getId())
                .tipoRelatorio(entity.getTipoRelatorio())
                .exercicio(entity.getExercicio())
                .periodo(entity.getPeriodo())
                .tipoPeriodo(entity.getTipoPeriodo())
                .dataPublicacao(entity.getDataPublicacao())
                .arquivoPdfUrl(entity.getArquivoPdfUrl())
                .arquivoNome(entity.getArquivoNome())
                .build();
    }

    // --- MOTOR DE DISPARO DE LOGS ---
    private void dispararLog(String acao, String identificador, Object dado, String observacao) {
        try {
            String jsonEstado = objectMapper.writeValueAsString(dado);
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    acao,
                    "PRESTACAO_CONTAS",
                    identificador,
                    jsonEstado,
                    observacao
            ));
        } catch (Exception e) {
            log.error("Falha ao gerar JSON de auditoria para Prestação de Contas", e);
        }
    }
}