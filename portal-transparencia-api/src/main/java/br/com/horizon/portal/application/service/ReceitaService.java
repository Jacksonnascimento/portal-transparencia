package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
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
    private final ApplicationEventPublisher eventPublisher; // INJETADO PARA AUDITORIA
    
    // Formato padrão brasileiro para datas
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        // Geramos o ID do lote logo no início para carimbar as entidades e o log
        String loteId = "LOTE-" + startTime;

        log.info("Iniciando importação robusta de receitas. ID do Lote: {}...", loteId);

        List<ReceitaEntity> receitasParaSalvar = new ArrayList<>();
        int linhaAtual = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            String linha;
            // Pula o cabeçalho
            br.readLine(); 

            while ((linha = br.readLine()) != null) {
                linhaAtual++;
                
                // Ignora linhas em branco
                if (linha.trim().isEmpty()) continue;

                // Divide por ponto e vírgula (padrão mais seguro que vírgula)
                String[] dados = linha.split(";", -1);

                // Validação de Estrutura: Deve ter 13 colunas conforme layout
                if (dados.length < 13) {
                    throw new IllegalArgumentException("Erro na linha " + linhaAtual + ": Número de colunas insuficiente. Esperado 13.");
                }

                try {
                    // Passamos o loteId para que cada entidade seja "carimbada"
                    ReceitaEntity receita = montarReceita(dados, loteId);
                    receitasParaSalvar.add(receita);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Erro de validação na linha " + linhaAtual + ": " + e.getMessage());
                }
            }

            // Salva em lote (Batch) para performance
            repository.saveAll(receitasParaSalvar);
            
            // --- GATILHO DE AUDITORIA ---
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
     * Remove todas as receitas vinculadas a um lote específico e registra na auditoria.
     * Captura os dados existentes antes da exclusão para permitir auditoria detalhada.
     */
    @Transactional
    public void excluirLote(String loteId) {
        // 1. Buscar os registros que serão excluídos para compor o log de auditoria (Dados Anteriores)
        List<ReceitaEntity> receitasParaExcluir = repository.findByIdImportacao(loteId);
        
        if (receitasParaExcluir.isEmpty()) {
            throw new IllegalArgumentException("Lote não encontrado ou já excluído: " + loteId);
        }

        int totalRegistros = receitasParaExcluir.size();

        // 2. Registrar o rastro na Auditoria (Rollback) enviando a lista para o campo dadosAnteriores
        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "EXCLUSAO_LOTE_RECEITA",
                "RECEITA",
                loteId,
                receitasParaExcluir, // Agora passamos a lista completa para o log ver "item a item"
                "Operação de revogação de lote executada. Total de itens removidos: " + totalRegistros
        ));

        // 3. Executar a exclusão massiva no banco
        repository.deleteByIdImportacao(loteId);

        log.info("Rollback concluído: Lote {} removido com sucesso ({} registros afetados).", loteId, totalRegistros);
    }

    private ReceitaEntity montarReceita(String[] dados, String loteId) {
        ReceitaEntity entity = new ReceitaEntity();

        entity.setIdImportacao(loteId);

        // 0: Exercicio
        entity.setExercicio(Integer.parseInt(limparTexto(dados[0])));
        // 1: Mês
        entity.setMes(Integer.parseInt(limparTexto(dados[1])));
        // 2: Data Lançamento
        entity.setDataLancamento(parseData(dados[2]));
        // 3: Categoria Econômica
        entity.setCategoriaEconomica(validarObrigatorio(dados[3], "Categoria Econômica"));
        // 4: Origem
        entity.setOrigem(validarObrigatorio(dados[4], "Origem"));
        // 5: Espécie
        entity.setEspecie(limparTexto(dados[5]));
        // 6: Rubrica
        entity.setRubrica(limparTexto(dados[6]));
        // 7: Alínea
        entity.setAlinea(limparTexto(dados[7]));
        // 8: Fonte de Recursos
        entity.setFonteRecursos(validarObrigatorio(dados[8], "Fonte de Recursos"));
        // 9: Valor Previsto Inicial
        entity.setValorPrevistoInicial(parseMoeda(dados[9]));
        // 10: Valor Previsto Atualizado
        entity.setValorPrevistoAtualizado(parseMoeda(dados[10]));
        // 11: Valor Arrecadado
        BigDecimal arrecadado = parseMoeda(dados[11]);
        if (arrecadado == null) throw new IllegalArgumentException("Valor Arrecadado não pode ser nulo");
        entity.setValorArrecadado(arrecadado);
        // 12: Histórico
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