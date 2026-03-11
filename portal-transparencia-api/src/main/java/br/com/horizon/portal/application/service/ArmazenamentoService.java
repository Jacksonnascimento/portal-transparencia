package br.com.horizon.portal.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class ArmazenamentoService {

    // BLINDAGEM: Garante que o caminho base seja absoluto para evitar erros de deleção
    private final Path rootLocation = Paths.get(System.getProperty("user.dir"), "Anexos").toAbsolutePath().normalize();

    public ArmazenamentoService() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível inicializar a pasta de anexos.", e);
        }
    }

    public String salvar(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Falha ao armazenar arquivo vazio.");
            }
            
            String nomeOriginal = StringUtils.cleanPath(file.getOriginalFilename());
            
            if (nomeOriginal.contains("..")) {
                throw new RuntimeException("Caminho de arquivo inválido: " + nomeOriginal);
            }

            String extensao = "";
            int i = nomeOriginal.lastIndexOf('.');
            if (i > 0) {
                extensao = nomeOriginal.substring(i);
            }

            String novoNome = UUID.randomUUID().toString() + extensao;
            Path destinationFile = this.rootLocation.resolve(novoNome).normalize().toAbsolutePath();

            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("✅ Arquivo salvo com sucesso fisicamente: {}", destinationFile);

            return "/api/v1/portal/arquivos/" + novoNome;
            
        } catch (IOException e) {
            throw new RuntimeException("Falha ao armazenar arquivo.", e);
        }
    }

    public Resource carregar(String nomeArquivo) {
        try {
            Path file = rootLocation.resolve(nomeArquivo).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Não foi possível ler o arquivo: " + nomeArquivo);
            }
        } catch (Exception e) {
            throw new RuntimeException("Não foi possível ler o arquivo: " + nomeArquivo, e);
        }
    }

    // LIXEIRA AUTOMÁTICA TURBINADA
    public void apagar(String rotaOuNome) {
        if (rotaOuNome == null || rotaOuNome.trim().isEmpty()) {
            return;
        }
        try {
            // 1. Garante a extração apenas do nome do arquivo da URL (ignora rotas e parâmetros)
            String nomeArquivo = rotaOuNome;
            if (rotaOuNome.contains("/")) {
                nomeArquivo = rotaOuNome.substring(rotaOuNome.lastIndexOf('/') + 1);
            }
            if (nomeArquivo.contains("?")) {
                nomeArquivo = nomeArquivo.substring(0, nomeArquivo.indexOf('?'));
            }
            nomeArquivo = nomeArquivo.trim();

            if (nomeArquivo.isEmpty()) {
                return;
            }

            // 2. Resolve o caminho físico exato no SO
            Path file = this.rootLocation.resolve(nomeArquivo).normalize().toAbsolutePath();
            File arquivoFisico = file.toFile();

            // 3. Tenta deletar fisicamente informando o resultado
            if (arquivoFisico.exists()) {
                boolean deletado = arquivoFisico.delete(); // Método raiz e direto do SO
                if (deletado) {
                    log.info("🗑️ LIXEIRA AUTOMÁTICA: Arquivo antigo limpo do disco: {}", file);
                } else {
                    log.warn("⚠️ LIXEIRA AUTOMÁTICA: O SO impediu a deleção (Arquivo em uso?): {}", file);
                }
            } else {
                log.info("⚠️ LIXEIRA AUTOMÁTICA: O arquivo já não existia no disco: {}", file);
            }
            
        } catch (Exception e) {
            log.error("❌ LIXEIRA AUTOMÁTICA: Falha crítica ao tentar deletar o arquivo da URL: {}", rotaOuNome, e);
        }
    }
}