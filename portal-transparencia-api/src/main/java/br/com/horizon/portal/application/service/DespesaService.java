package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.CredorEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.CredorRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
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
public class DespesaService {

    private final DespesaRepository despesaRepository;
    private final CredorRepository credorRepository;

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        log.info("Iniciando importação de despesas: {}", file.getOriginalFilename());

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "ISO-8859-1"))) {
            
            CSVParser parser = new CSVParserBuilder().withSeparator(';').build();
            CSVReader csvReader = new CSVReaderBuilder(reader).withSkipLines(1).withCSVParser(parser).build();

            List<String[]> linhas = csvReader.readAll();
            List<DespesaEntity> despesasParaSalvar = new ArrayList<>();

            for (String[] colunas : linhas) {
                if (colunas.length < 10) continue;

                // 1. Lógica do Credor (Busca ou Cria)
                String documento = colunas[4].trim().replaceAll("[^0-9]", ""); 
                String nomeCredor = colunas[5].trim();

                CredorEntity credor = credorRepository.findByCpfCnpj(documento)
                        .orElseGet(() -> {
                            CredorEntity novo = CredorEntity.builder()
                                    .cpfCnpj(documento)
                                    .razaoSocial(nomeCredor)
                                    .tipoPessoa(documento.length() > 11 ? "JURIDICA" : "FISICA") // CORRIGIDO AQUI
                                    .build();
                            return credorRepository.save(novo);
                        });

                // 2. Monta a Despesa
                DespesaEntity despesa = DespesaEntity.builder()
                        .exercicio(Integer.parseInt(colunas[0].trim()))
                        .numeroEmpenho(colunas[1].trim())
                        .dataEmpenho(parseData(colunas[2].trim()))
                        .orgaoNome(colunas[3].trim())
                        .credor(credor) 
                        .elementoDespesa(colunas[6].trim())
                        .valorEmpenhado(parseValor(colunas[7].trim()))
                        .valorLiquidado(parseValor(colunas[8].trim()))
                        .valorPago(parseValor(colunas[9].trim()))
                        .historico(colunas[10].trim())
                        .build();

                despesasParaSalvar.add(despesa);
            }

            despesaRepository.saveAll(despesasParaSalvar);
            log.info("Importação de despesas concluída: {} registros.", despesasParaSalvar.size());

        } catch (Exception e) {
            log.error("Erro ao importar despesas", e);
            throw new RuntimeException("Erro no processamento das despesas: " + e.getMessage());
        }
    }

    private LocalDate parseData(String dataStr) {
        return LocalDate.parse(dataStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private BigDecimal parseValor(String valorStr) {
        String limpo = valorStr.replace(".", "").replace(",", ".");
        return new BigDecimal(limpo);
    }
}