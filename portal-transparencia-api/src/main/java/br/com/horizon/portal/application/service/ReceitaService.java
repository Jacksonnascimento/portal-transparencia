package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceitaService {

    private final ReceitaRepository repository;

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        log.info("Iniciando importação do arquivo: {}", file.getOriginalFilename());

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "ISO-8859-1"))) { 
            // DICA: Usei ISO-8859-1 (Latin1) pois Excel brasileiro costuma salvar assim e não em UTF-8. 
            // Se der problema de acentuação, troque para StandardCharsets.UTF_8

            // Configura o parser para usar PONTO E VÍRGULA
            CSVParser parser = new CSVParserBuilder()
                    .withSeparator(';') 
                    .withIgnoreQuotations(true)
                    .build();

            CSVReader csvReader = new CSVReaderBuilder(reader)
                    .withSkipLines(1) // Pula o cabeçalho
                    .withCSVParser(parser)
                    .build();

            List<String[]> linhas = csvReader.readAll();
            List<ReceitaEntity> receitasParaSalvar = new ArrayList<>();

            for (String[] colunas : linhas) {
                // Previne erro se tiver linha em branco no final do arquivo
                if(colunas.length < 7) continue;

                ReceitaEntity receita = ReceitaEntity.builder()
                        .exercicio(Integer.parseInt(colunas[0].trim()))
                        .mes(Integer.parseInt(colunas[1].trim()))
                        .categoriaEconomica(colunas[2].trim())
                        .origem(colunas[3].trim())
                        .fonteRecursos(colunas[4].trim())
                        .dataLancamento(parseData(colunas[5].trim()))
                        .valorArrecadado(parseValor(colunas[6].trim()))
                        .build();

                receitasParaSalvar.add(receita);
            }

            repository.saveAll(receitasParaSalvar);
            log.info("Importação concluída. {} registros salvos.", receitasParaSalvar.size());

        } catch (Exception e) {
            log.error("Erro ao processar arquivo CSV", e);
            throw new RuntimeException("Falha na importação: " + e.getMessage());
        }
    }

    private LocalDate parseData(String dataStr) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return LocalDate.parse(dataStr, formatter);
    }

    private BigDecimal parseValor(String valorStr) {
        // Remove pontos de milhar e troca vírgula decimal por ponto
        // Ex: "1.500,50" vira "1500.50"
        String limpo = valorStr.replace(".", "").replace(",", ".");
        return new BigDecimal(limpo);
    }
}