package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.*;

@Service
@RequiredArgsConstructor
public class ConfiguracaoService {

    private final ConfiguracaoRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final String PASTA_IMAGENS = System.getProperty("user.dir") + File.separator + "Imagens";

    public ConfiguracaoDTO.Response obterConfiguracao() {
        return repository.findById(1L)
                .map(ConfiguracaoDTO.Response::fromEntity)
                .orElseThrow(() -> new RuntimeException("Configuração inicial não encontrada no banco."));
    }

    @Transactional
    public ConfiguracaoDTO.Response atualizar(ConfiguracaoDTO.Update dto) {
        ConfiguracaoEntity entity = repository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Configuração não encontrada."));

        // Captura estado anterior para o Log de Auditoria
        ConfiguracaoDTO.Response estadoAnterior = ConfiguracaoDTO.Response.fromEntity(entity);

        // Mapeamento dos campos (Básicos)
        entity.setNomeEntidade(dto.nomeEntidade());
        entity.setCnpj(dto.cnpj());
        entity.setCorPrincipal(dto.corPrincipal());
        entity.setEndereco(dto.endereco());
        entity.setTelefone(dto.telefone());
        entity.setHorarioAtendimento(dto.horarioAtendimento());
        entity.setSiteOficial(dto.siteOficial());
        entity.setDiarioOficial(dto.diarioOficial());
        entity.setPortalContribuinte(dto.portalContribuinte());
        entity.setFacebook(dto.facebook());
        entity.setInstagram(dto.instagram());
        entity.setTwitter(dto.twitter());
        entity.setEmailEntidade(dto.emailEntidade());
        entity.setLinkOuvidoria(dto.linkOuvidoria());
        entity.setTelefoneOuvidoria(dto.telefoneOuvidoria());
        entity.setEmailOuvidoria(dto.emailOuvidoria());
        entity.setPoliticaPrivacidade(dto.politicaPrivacidade());
        entity.setTermosUso(dto.termosUso());

        // MAPEAMENTO DOS NOVOS CAMPOS DO E-SIC E SMTP
        entity.setEnderecoSic(dto.enderecoSic());
        entity.setHorarioAtendimentoSic(dto.horarioAtendimentoSic());
        entity.setTelefoneSic(dto.telefoneSic());
        entity.setEmailSic(dto.emailSic());
        entity.setSmtpHost(dto.smtpHost());
        entity.setSmtpPort(dto.smtpPort());
        entity.setSmtpUsername(dto.smtpUsername());
        entity.setSmtpPassword(dto.smtpPassword());

        ConfiguracaoEntity saved = repository.save(entity);
        ConfiguracaoDTO.Response estadoNovo = ConfiguracaoDTO.Response.fromEntity(saved);

        // Dispara Auditoria Independente (Seguindo o construtor da sua classe LogAuditoriaEvent)
        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "ATUALIZACAO",
                "CONFIGURACAO",
                "1",
                estadoAnterior,
                estadoNovo));

        return estadoNovo;
    }

    @Transactional
    public String salvarBrasao(MultipartFile file) {
        long MAX_SIZE_BYTES = 2 * 1024 * 1024;
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new RuntimeException("Ficheiro recusado: O tamanho do brasão excede o limite máximo de 2MB.");
        }

        try {
            File diretorio = new File(PASTA_IMAGENS);
            if (!diretorio.exists()) diretorio.mkdirs();

            File[] arquivosAntigos = diretorio.listFiles((dir, name) -> name.startsWith("brasao"));
            if (arquivosAntigos != null) {
                for (File f : arquivosAntigos) f.delete();
            }

            String extensao = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                extensao = originalName.substring(originalName.lastIndexOf("."));
            }

            String nomeArquivo = "brasao" + extensao;
            Path caminho = Paths.get(PASTA_IMAGENS, nomeArquivo);
            Files.copy(file.getInputStream(), caminho, StandardCopyOption.REPLACE_EXISTING);

            ConfiguracaoEntity entity = repository.findById(1L).orElseThrow();
            String urlAntiga = entity.getUrlBrasao();

            entity.setUrlBrasao("/api/v1/portal/configuracoes/brasao");
            repository.save(entity);

            eventPublisher.publishEvent(
                    new LogAuditoriaEvent("ATUALIZACAO_BRASAO", "CONFIGURACAO", "1", urlAntiga, entity.getUrlBrasao()));

            return entity.getUrlBrasao();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar arquivo: " + e.getMessage());
        }
    }
}