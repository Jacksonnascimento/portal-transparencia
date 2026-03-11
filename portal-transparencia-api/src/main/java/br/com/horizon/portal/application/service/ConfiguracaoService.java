package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracaoService {

    private final ConfiguracaoRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    
    // Injetando o nosso serviço centralizado de arquivos
    private final ArmazenamentoService armazenamentoService;

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

        // REGRA DE SAÚDE DO SERVIDOR: Verifica se o brasão mudou. Se sim, apaga o antigo.
        // O ArmazenamentoService tem blindagem para ignorar o arquivo caso a URL antiga seja "/api/v1/portal/configuracoes/brasao"
        if (dto.urlBrasao() != null && !dto.urlBrasao().equals(entity.getUrlBrasao())) {
            if (entity.getUrlBrasao() != null) {
                armazenamentoService.apagar(entity.getUrlBrasao());
            }
            entity.setUrlBrasao(dto.urlBrasao()); // Salva a nova URL do brasão no banco
        }

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

        // Dispara Auditoria Independente
        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "ATUALIZACAO",
                "CONFIGURACAO",
                "1",
                estadoAnterior,
                estadoNovo));

        return estadoNovo;
    }

    
}