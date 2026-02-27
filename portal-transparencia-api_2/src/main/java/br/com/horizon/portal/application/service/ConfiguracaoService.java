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
        // --- NOVA VALIDAÇÃO DE TAMANHO (Limite de 2MB) ---
        long MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 Megabytes
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new RuntimeException("Ficheiro recusado: O tamanho do brasão excede o limite máximo de 2MB.");
        }

        try {
            File diretorio = new File(PASTA_IMAGENS);
            if (!diretorio.exists()) diretorio.mkdirs();

            // 1. Limpeza total: Apaga qualquer ficheiro anterior que seja um brasão
            File[] arquivosAntigos = diretorio.listFiles((dir, name) -> name.startsWith("brasao"));
            if (arquivosAntigos != null) {
                for (File f : arquivosAntigos) {
                    f.delete();
                }
            }

            // 2. Extrai a extensão e nomeia cravado como "brasao"
            String extensao = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                extensao = originalName.substring(originalName.lastIndexOf("."));
            }
            
            String nomeArquivo = "brasao" + extensao;
            Path caminho = Paths.get(PASTA_IMAGENS, nomeArquivo);
            
            // 3. Salva o novo ficheiro
            Files.copy(file.getInputStream(), caminho, StandardCopyOption.REPLACE_EXISTING);

            // 4. Atualiza o banco
            ConfiguracaoEntity entity = repository.findById(1L).orElseThrow();
            entity.setUrlBrasao("/api/v1/portal/configuracoes/brasao");
            repository.save(entity);
            
            return entity.getUrlBrasao();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar arquivo: " + e.getMessage());
        }
    }
}