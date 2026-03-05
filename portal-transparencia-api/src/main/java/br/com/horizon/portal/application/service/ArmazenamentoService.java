package br.com.horizon.portal.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class ArmazenamentoService {

    // Cria a pasta 'Anexos' na raiz do seu projeto automaticamente
    private final Path rootLocation = Paths.get("Anexos");

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
            
            // Trava de segurança contra navegação de diretório maliciosa
            if (nomeOriginal.contains("..")) {
                throw new RuntimeException("Caminho de arquivo inválido: " + nomeOriginal);
            }

            // Extrai a extensão do arquivo (ex: .pdf, .png)
            String extensao = "";
            int i = nomeOriginal.lastIndexOf('.');
            if (i > 0) {
                extensao = nomeOriginal.substring(i);
            }

            // Gera um nome único (Ex: 550e8400-e29b-41d4-a716-446655440000.pdf)
            String novoNome = UUID.randomUUID().toString() + extensao;
            Path destinationFile = this.rootLocation.resolve(Paths.get(novoNome)).normalize().toAbsolutePath();

            // Salva o arquivo no disco
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Arquivo salvo com sucesso: {}", destinationFile);

            // Retorna a ROTA da API que o front-end vai usar para ler esse arquivo depois
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
}