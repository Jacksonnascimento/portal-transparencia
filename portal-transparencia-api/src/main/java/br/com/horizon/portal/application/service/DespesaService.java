package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.CredorEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.CredorRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DespesaService {

    private final DespesaRepository despesaRepository;
    private final CredorRepository credorRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // --- INGESTÃO MASSIVA COM AUDITORIA E CACHE ---

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        String loteId = "LOTE-DESPESA-" + System.currentTimeMillis();
        List<DespesaEntity> despesasParaSalvar = new ArrayList<>();
        
        // Cache de credores para não sobrecarregar o banco com SELECTs repetidos
        Map<String, CredorEntity> credorCache = new HashMap<>();
        
        int linhaAtual = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            br.readLine(); // Pula o cabeçalho

            while ((linha = br.readLine()) != null) {
                linhaAtual++;
                if (linha.trim().isEmpty()) continue;
                
                // O limite -1 garante que colunas vazias no final não sejam ignoradas pelo array
                String[] dados = linha.split(";", -1);

                if (dados.length < 22) {
                    throw new IllegalArgumentException("Linha " + linhaAtual + ": O CSV de despesas deve conter 22 colunas padrão PNTP.");
                }

                // 1. Tratamento do Credor (Índices 13 e 14)
                String cpfCnpj = dados[13].trim().replaceAll("\\D", ""); // Limpa formatação
                String razaoSocial = dados[14].trim();
                CredorEntity credor = null;

                if (!cpfCnpj.isEmpty()) {
                    // Busca no cache da memória; se não achar, busca no banco; se não achar, cria novo.
                    credor = credorCache.computeIfAbsent(cpfCnpj, key -> 
                        credorRepository.findByCpfCnpj(key).orElseGet(() -> {
                            CredorEntity novoCredor = CredorEntity.builder()
                                .cpfCnpj(key)
                                .razaoSocial(razaoSocial.isEmpty() ? "NÃO INFORMADO" : razaoSocial)
                                .tipoPessoa(key.length() == 11 ? "FISICA" : "JURIDICA")
                                .build();
                            return credorRepository.save(novoCredor); // Salva na hora para gerar o ID
                        })
                    );
                }

                // 2. Montagem da Entidade de Despesa
                DespesaEntity despesa = new DespesaEntity();
                despesa.setIdImportacao(loteId);
                despesa.setExercicio(Integer.parseInt(dados[0].trim()));
                despesa.setNumeroEmpenho(dados[1].trim());
                despesa.setDataEmpenho(parseData(dados[2].trim()));
                
                despesa.setOrgaoCodigo(dados[3].trim());
                despesa.setOrgaoNome(dados[4].trim());
                despesa.setUnidadeCodigo(dados[5].trim());
                despesa.setUnidadeNome(dados[6].trim());
                
                despesa.setFuncao(dados[7].trim());
                despesa.setSubfuncao(dados[8].trim());
                despesa.setPrograma(dados[9].trim());
                despesa.setAcaoGoverno(dados[10].trim());
                despesa.setElementoDespesa(dados[11].trim());
                despesa.setFonteRecursos(dados[12].trim());
                
                despesa.setCredor(credor); // Relacionamento inteligente
                
                despesa.setValorEmpenhado(parseMoeda(dados[15].trim()));
                despesa.setValorLiquidado(parseMoeda(dados[16].trim()));
                despesa.setDataLiquidacao(parseData(dados[17].trim()));
                despesa.setValorPago(parseMoeda(dados[18].trim()));
                despesa.setDataPagamento(parseData(dados[19].trim()));
                
                despesa.setHistoricoObjetivo(dados[20].trim());
                despesa.setModalidadeLicitacao(dados[21].trim());

                despesasParaSalvar.add(despesa);
            }

            // Salva todas as despesas em Batch (Alta performance)
            despesaRepository.saveAll(despesasParaSalvar);

            // LOG DE AUDITORIA (Exigência Ouro)
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                "IMPORTACAO_LOTE_CSV", 
                "DESPESA", 
                loteId, 
                null,
                "Importação de " + despesasParaSalvar.size() + " registros via CSV."
        ));

        } catch (Exception e) {
            log.error("Erro na importação de Despesa Pública na linha {}", linhaAtual, e);
            throw new RuntimeException("Falha ao processar CSV na linha " + linhaAtual + ": " + e.getMessage());
        }
    }

    // --- ROLLBACK DE SEGURANÇA ---

    @Transactional
    public void excluirLote(String loteId) {
        // 1. Busca os registros (Use findByIdImportacao se já tiver criado, senão use o filtro stream)
        List<DespesaEntity> paraExcluir = despesaRepository.findAll().stream()
                .filter(d -> loteId.equals(d.getIdImportacao())).toList();

        if (paraExcluir.isEmpty()) throw new IllegalArgumentException("Lote não encontrado: " + loteId);

        try {
            // 2. CORREÇÃO CRÍTICA: Em vez de passar a entidade JPA pura para o ObjectMapper,
            // criamos uma lista de Map simples. Isso evita o erro de Proxy do Hibernate e Recursão.
            List<Map<String, Object>> dadosSimplificados = paraExcluir.stream().map(d -> {
                Map<String, Object> map = new HashMap<>();
                map.put("exercicio", d.getExercicio());
                map.put("numeroEmpenho", d.getNumeroEmpenho());
                map.put("valorEmpenhado", d.getValorEmpenhado());
                map.put("razaoSocial", d.getCredor() != null ? d.getCredor().getRazaoSocial() : "NÃO INFORMADO");
                return map;
            }).toList();

            String jsonExcluidos = objectMapper.writeValueAsString(dadosSimplificados);
            
            // 3. Dispara o Log (Garantindo o nome "DESPESA" para o Front)
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "EXCLUSAO_LOTE", 
                    "DESPESA", 
                    loteId, 
                    jsonExcluidos,
                    "Revogação total do lote. Itens removidos: " + paraExcluir.size()
            ));
            
            // 4. Deleta de forma performática
            despesaRepository.deleteAllInBatch(paraExcluir);

        } catch (Exception e) {
            log.error("Erro ao processar reversão do lote {}", loteId, e);
            throw new RuntimeException("Falha ao auditar exclusão de lote: " + e.getMessage());
        }
    }

    // --- MÉTODOS AUXILIARES ---

    private BigDecimal parseMoeda(String valor) {
        if (valor == null || valor.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(valor.replace(".", "").replace(",", "."));
    }

    private LocalDate parseData(String dataStr) {
        if (dataStr == null || dataStr.isBlank()) return null;
        try {
            return LocalDate.parse(dataStr, DATE_FORMATTER);
        } catch (Exception e) {
            return null; // Caso a data venha mal formatada, salvamos como null em vez de quebrar tudo
        }
    }
}