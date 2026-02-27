package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import com.fasterxml.jackson.databind.ObjectMapper; // Importado para serialização
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceitaService {

    private final ReceitaRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper; // Necessário para salvar o "item a item" no log

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        String loteId = "LOTE-" + startTime;

        log.info("Iniciando importação robusta de receitas. ID do Lote: {}...", loteId);

        List<ReceitaEntity> receitasParaSalvar = new ArrayList<>();
        int linhaAtual = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            String linha;
            br.readLine(); // Pula cabeçalho

            while ((linha = br.readLine()) != null) {
                linhaAtual++;
                if (linha.trim().isEmpty()) continue;

                String[] dados = linha.split(";", -1);

                if (dados.length < 13) {
                    throw new IllegalArgumentException("Erro na linha " + linhaAtual + ": Número de colunas insuficiente. Esperado 13.");
                }

                try {
                    ReceitaEntity receita = montarReceita(dados, loteId);
                    receitasParaSalvar.add(receita);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Erro de validação na linha " + linhaAtual + ": " + e.getMessage());
                }
            }

            repository.saveAll(receitasParaSalvar);
            
            String resumoImportacao = "Foram importados " + receitasParaSalvar.size() + " registros vinculados ao lote: " + loteId;
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "IMPORTACAO_LOTE_CSV",
                    "RECEITA",
                    loteId, 
                    null,
                    resumoImportacao
            ));

            long endTime = System.currentTimeMillis();
            log.info("Lote {} concluído. {} registros processados em {} ms.", loteId, receitasParaSalvar.size(), (endTime - startTime));

        } catch (IOException e) {
            log.error("Erro ao ler arquivo", e);
            throw new RuntimeException("Falha ao processar arquivo CSV: " + e.getMessage());
        }
    }

    /**
     * Remove todas as receitas vinculadas a um lote e registra o estado anterior no log.
     */
    @Transactional
    public void excluirLote(String loteId) {
        log.info("Iniciando processo de revogação para o lote: {}", loteId);

        // 1. Buscar os registros que serão excluídos
        List<ReceitaEntity> receitasParaExcluir = repository.findByIdImportacao(loteId);
        
        if (receitasParaExcluir.isEmpty()) {
            log.error("Falha ao desfazer: Lote {} não possui registros no banco.", loteId);
            throw new IllegalArgumentException("Lote não encontrado ou já excluído: " + loteId);
        }

        try {
            // 2. Serializar a lista para JSON antes de deletar
            // Isso garante que o LogAuditoriaListener tenha os dados prontos para salvar
            String jsonDadosExcluidos = objectMapper.writeValueAsString(receitasParaExcluir);

            // 3. Registrar a Auditoria passando o JSON no campo dadosAnteriores
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "EXCLUSAO_LOTE_RECEITA",
                    "RECEITA",
                    loteId,
                    jsonDadosExcluidos, // O JSON vai como String para o log
                    "Revogação total do lote executada. Itens removidos: " + receitasParaExcluir.size()
            ));

            // 4. Excluir do banco
            repository.deleteByIdImportacao(loteId);
            log.info("Lote {} removido com sucesso. {} registros apagados.", loteId, receitasParaExcluir.size());

        } catch (Exception e) {
            log.error("Erro técnico ao gerar log de exclusão para o lote {}", loteId, e);
            throw new RuntimeException("Falha ao processar auditoria de exclusão.");
        }
    }

    private ReceitaEntity montarReceita(String[] dados, String loteId) {
        ReceitaEntity entity = new ReceitaEntity();
        entity.setIdImportacao(loteId);

        entity.setExercicio(Integer.parseInt(limparTexto(dados[0])));
        entity.setMes(Integer.parseInt(limparTexto(dados[1])));
        entity.setDataLancamento(parseData(dados[2]));
        entity.setCategoriaEconomica(validarObrigatorio(dados[3], "Categoria Econômica"));
        entity.setOrigem(validarObrigatorio(dados[4], "Origem"));
        entity.setEspecie(limparTexto(dados[5]));
        entity.setRubrica(limparTexto(dados[6]));
        entity.setAlinea(limparTexto(dados[7]));
        entity.setFonteRecursos(validarObrigatorio(dados[8], "Fonte de Recursos"));
        entity.setValorPrevistoInicial(parseMoeda(dados[9]));
        entity.setValorPrevistoAtualizado(parseMoeda(dados[10]));
        
        BigDecimal arrecadado = parseMoeda(dados[11]);
        if (arrecadado == null) throw new IllegalArgumentException("Valor Arrecadado não pode ser nulo");
        entity.setValorArrecadado(arrecadado);
        
        entity.setHistorico(limparTexto(dados[12]));

        return entity;
    }

    private String limparTexto(String valor) {
        return valor != null ? valor.trim() : "";
    }

    private String validarObrigatorio(String valor, String nomeCampo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("Campo obrigatório ausente: " + nomeCampo);
        }
        return valor.trim();
    }

    private LocalDate parseData(String dataStr) {
        try {
            return LocalDate.parse(dataStr.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Data inválida: " + dataStr + ". Formato esperado: dd/MM/yyyy");
        }
    }

    private BigDecimal parseMoeda(String valorStr) {
        if (valorStr == null || valorStr.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            String limpo = valorStr.trim().replace(".", "").replace(",", ".");
            return new BigDecimal(limpo);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valor monetário inválido: " + valorStr);
        }
    }
}