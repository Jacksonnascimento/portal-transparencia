package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    
    // Formato padrão brasileiro para datas
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando importação robusta de receitas...");

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
                    ReceitaEntity receita = montarReceita(dados);
                    receitasParaSalvar.add(receita);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Erro de validação na linha " + linhaAtual + ": " + e.getMessage());
                }
            }

            // Salva em lote (Batch) para performance
            repository.saveAll(receitasParaSalvar);
            
            long endTime = System.currentTimeMillis();
            log.info("Importação concluída. {} registros processados em {} ms.", receitasParaSalvar.size(), (endTime - startTime));

        } catch (IOException e) {
            log.error("Erro ao ler arquivo", e);
            throw new RuntimeException("Falha ao processar arquivo CSV: " + e.getMessage());
        }
    }

    private ReceitaEntity montarReceita(String[] dados) {
        ReceitaEntity entity = new ReceitaEntity();

        // 0: Exercicio (Obrigatório)
        entity.setExercicio(Integer.parseInt(limparTexto(dados[0])));

        // 1: Mês (Obrigatório)
        entity.setMes(Integer.parseInt(limparTexto(dados[1])));

        // 2: Data Lançamento (Obrigatório)
        entity.setDataLancamento(parseData(dados[2]));

        // 3: Categoria Econômica (Obrigatório)
        entity.setCategoriaEconomica(validarObrigatorio(dados[3], "Categoria Econômica"));

        // 4: Origem (Obrigatório)
        entity.setOrigem(validarObrigatorio(dados[4], "Origem"));

        // 5: Espécie
        entity.setEspecie(limparTexto(dados[5]));

        // 6: Rubrica
        entity.setRubrica(limparTexto(dados[6]));

        // 7: Alínea
        entity.setAlinea(limparTexto(dados[7]));

        // 8: Fonte de Recursos (Obrigatório - Crucial para licitações)
        entity.setFonteRecursos(validarObrigatorio(dados[8], "Fonte de Recursos"));

        // 9: Valor Previsto Inicial
        entity.setValorPrevistoInicial(parseMoeda(dados[9]));

        // 10: Valor Previsto Atualizado
        entity.setValorPrevistoAtualizado(parseMoeda(dados[10]));

        // 11: Valor Arrecadado (Obrigatório)
        BigDecimal arrecadado = parseMoeda(dados[11]);
        if (arrecadado == null) throw new IllegalArgumentException("Valor Arrecadado não pode ser nulo");
        entity.setValorArrecadado(arrecadado);

        // 12: Histórico
        entity.setHistorico(limparTexto(dados[12]));

        return entity;
    }

    // --- Métodos Auxiliares de Tratamento e Conversão ---

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
            // Remove pontos de milhar e troca vírgula decimal por ponto
            // Ex: "1.500,50" -> "1500.50"
            String limpo = valorStr.trim().replace(".", "").replace(",", ".");
            return new BigDecimal(limpo);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valor monetário inválido: " + valorStr);
        }
    }
}