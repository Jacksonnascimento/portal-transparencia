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

    // BLINDAGEM: Garante que o caminho base seja absoluto. Alterado de "Anexos" para "Arquivos"
    private final Path rootLocation = Paths.get(System.getProperty("user.dir"), "Arquivos").toAbsolutePath().normalize();

    public ArmazenamentoService() {
        try {
            // Cria a pasta principal e as subpastas estruturais padrão de imediato
            Files.createDirectories(rootLocation);
            Files.createDirectories(rootLocation.resolve("dirigentes"));
            Files.createDirectories(rootLocation.resolve("config"));
            Files.createDirectories(rootLocation.resolve("sic"));
            Files.createDirectories(rootLocation.resolve("geral"));
            log.info("📁 Estrutura de armazenamento inicializada em: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível inicializar a estrutura de pastas de arquivos.", e);
        }
    }

    // Sobrecarga para manter a compatibilidade se alguém chamar sem especificar a pasta
    public String salvar(MultipartFile file) {
        return salvar(file, "geral");
    }

    public String salvar(MultipartFile file, String subPasta) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Falha ao armazenar arquivo vazio.");
            }
            
            String nomeOriginal = StringUtils.cleanPath(file.getOriginalFilename());
            
            if (nomeOriginal.contains("..")) {
                throw new RuntimeException("Caminho de arquivo original inválido: " + nomeOriginal);
            }

            String extensao = "";
            int i = nomeOriginal.lastIndexOf('.');
            if (i > 0) {
                extensao = nomeOriginal.substring(i);
            }

            String novoNome = UUID.randomUUID().toString() + extensao;
            
            // Resolve a subpasta dentro da raiz e blinda contra Path Traversal
            Path pastaDestino = this.rootLocation.resolve(subPasta).normalize().toAbsolutePath();
            if (!pastaDestino.startsWith(this.rootLocation)) {
                throw new RuntimeException("Tentativa de violação de diretório identificada (Path Traversal).");
            }

            Files.createDirectories(pastaDestino); // Garante que a subpasta existe caso seja nova

            Path destinationFile = pastaDestino.resolve(novoNome).normalize().toAbsolutePath();

            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("✅ Arquivo salvo com sucesso fisicamente em [{}]: {}", subPasta, destinationFile);

            // A URL agora embute a subpasta para o controller localizá-la depois
            return "/api/v1/portal/arquivos/" + subPasta + "/" + novoNome;
            
        } catch (IOException e) {
            throw new RuntimeException("Falha ao armazenar arquivo.", e);
        }
    }

    public Resource carregar(String subPasta, String nomeArquivo) {
        try {
            Path file = rootLocation.resolve(subPasta).resolve(nomeArquivo).normalize();
            
            // Blindagem adicional na leitura
            if (!file.startsWith(this.rootLocation)) {
                throw new RuntimeException("Acesso negado ao arquivo fora da raiz segura.");
            }

            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Não foi possível ler o arquivo: " + nomeArquivo + " na pasta " + subPasta);
            }
        } catch (Exception e) {
            throw new RuntimeException("Não foi possível ler o arquivo: " + nomeArquivo, e);
        }
    }

    // LIXEIRA AUTOMÁTICA TURBINADA E PREPARADA PARA SUBPASTAS
    public void apagar(String rotaOuNome) {
        if (rotaOuNome == null || rotaOuNome.trim().isEmpty()) {
            return;
        }
        try {
            // 1. Extração segura da rota relativa (ex: /api/v1/portal/arquivos/dirigentes/uuid.jpg -> dirigentes/uuid.jpg)
            String parteRelativa = rotaOuNome;
            String prefixo = "/api/v1/portal/arquivos/";
            
            if (parteRelativa.contains(prefixo)) {
                parteRelativa = parteRelativa.substring(parteRelativa.indexOf(prefixo) + prefixo.length());
            } else if (!parteRelativa.contains("/")) {
                // Compatibilidade com bancos antigos que só tem o nome do arquivo salvo
                parteRelativa = "geral/" + parteRelativa;
            }

            // Remove parâmetros de query, se houver
            if (parteRelativa.contains("?")) {
                parteRelativa = parteRelativa.substring(0, parteRelativa.indexOf('?'));
            }
            parteRelativa = parteRelativa.trim();

            if (parteRelativa.isEmpty()) {
                return;
            }

            // 2. Resolve o caminho físico exato no SO
            Path file = this.rootLocation.resolve(parteRelativa).normalize().toAbsolutePath();
            
            // Blindagem: Garante que a deleção ocorrerá estritamente dentro da pasta Arquivos
            if (!file.startsWith(this.rootLocation)) {
                log.warn("⚠️ LIXEIRA AUTOMÁTICA: Bloqueio de segurança. Tentativa de apagar arquivo fora da raiz: {}", file);
                return;
            }

            File arquivoFisico = file.toFile();

            // 3. Tenta deletar fisicamente informando o resultado
            if (arquivoFisico.exists()) {
                boolean deletado = arquivoFisico.delete();
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