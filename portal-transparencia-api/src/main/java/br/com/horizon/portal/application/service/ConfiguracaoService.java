package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.*;

@Service
@RequiredArgsConstructor
public class ConfiguracaoService {

    private final ConfiguracaoRepository repository;
    private final String PASTA_IMAGENS = System.getProperty("user.dir") + File.separator + "Imagens";

    public ConfiguracaoDTO.Response obterConfiguracao() {
        return repository.findById(1L)
                .map(ConfiguracaoDTO.Response::fromEntity)
                .orElseThrow(() -> new RuntimeException("Configuração inicial não encontrada no banco."));
    }

    @Transactional
    public ConfiguracaoDTO.Response atualizar(ConfiguracaoDTO.Update dto) {
        ConfiguracaoEntity entity = repository.findById(1L).orElseThrow();
        
        entity.setNomeEntidade(dto.nomeEntidade());
        entity.setCnpj(dto.cnpj());
        entity.setCorPrincipal(dto.corPrincipal());
        entity.setEndereco(dto.endereco());
        entity.setTelefone(dto.telefone());
        entity.setHorarioAtendimento(dto.horarioAtendimento());

        return ConfiguracaoDTO.Response.fromEntity(repository.save(entity));
    }

    @Transactional
    public String salvarBrasao(MultipartFile file) {
        try {
            File diretorio = new File(PASTA_IMAGENS);
            if (!diretorio.exists()) diretorio.mkdirs();

            String extensao = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            String nomeArquivo = "brasao_oficial" + extensao;
            Path caminho = Paths.get(PASTA_IMAGENS, nomeArquivo);
            
            Files.copy(file.getInputStream(), caminho, StandardCopyOption.REPLACE_EXISTING);

            ConfiguracaoEntity entity = repository.findById(1L).orElseThrow();
            entity.setUrlBrasao("/api/v1/portal/configuracoes/brasao");
            repository.save(entity);
            
            return entity.getUrlBrasao();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar arquivo: " + e.getMessage());
        }
    }
}