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

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        String loteId = "LOTE-DESPESA-" + System.currentTimeMillis();
        List<DespesaEntity> despesasParaSalvar = new ArrayList<>();
        Map<String, CredorEntity> credorCache = new HashMap<>();
        
        int linhaAtual = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            br.readLine(); // Pula o cabeçalho

            while ((linha = br.readLine()) != null) {
                linhaAtual++;
                if (linha.trim().isEmpty()) continue;
                
                String[] dados = linha.split(";", -1);

                // ATUALIZADO: Agora validamos 23 colunas devido ao Processo de Pagamento
                if (dados.length < 23) {
                    throw new IllegalArgumentException("Linha " + linhaAtual + ": O CSV deve conter 23 colunas padrão PNTP.");
                }

                // 1. Tratamento do Credor (Índices movidos para 14 e 15)
                String cpfCnpj = dados[14].trim().replaceAll("\\D", ""); 
                String razaoSocial = dados[15].trim();
                CredorEntity credor = null;

                if (!cpfCnpj.isEmpty()) {
                    credor = credorCache.computeIfAbsent(cpfCnpj, key -> 
                        credorRepository.findByCpfCnpj(key).orElseGet(() -> {
                            CredorEntity novoCredor = CredorEntity.builder()
                                .cpfCnpj(key)
                                .razaoSocial(razaoSocial.isEmpty() ? "NÃO INFORMADO" : razaoSocial)
                                .tipoPessoa(key.length() == 11 ? "FISICA" : "JURIDICA")
                                .build();
                            return credorRepository.save(novoCredor);
                        })
                    );
                }

                // 2. Montagem da Entidade (Índices ajustados a partir do índice 2)
                DespesaEntity despesa = new DespesaEntity();
                despesa.setIdImportacao(loteId);
                despesa.setExercicio(Integer.parseInt(dados[0].trim()));
                despesa.setNumeroEmpenho(dados[1].trim());
                despesa.setNumeroProcessoPagamento(dados[2].trim()); // NOVO CAMPO
                despesa.setDataEmpenho(parseData(dados[3].trim()));
                
                despesa.setOrgaoCodigo(dados[4].trim());
                despesa.setOrgaoNome(dados[5].trim());
                despesa.setUnidadeCodigo(dados[6].trim());
                despesa.setUnidadeNome(dados[7].trim());
                
                despesa.setFuncao(dados[8].trim());
                despesa.setSubfuncao(dados[9].trim());
                despesa.setPrograma(dados[10].trim());
                despesa.setAcaoGoverno(dados[11].trim());
                despesa.setElementoDespesa(dados[12].trim());
                despesa.setFonteRecursos(dados[13].trim());
                
                despesa.setCredor(credor);
                
                despesa.setValorEmpenhado(parseMoeda(dados[16].trim()));
                despesa.setValorLiquidado(parseMoeda(dados[17].trim()));
                despesa.setDataLiquidacao(parseData(dados[18].trim()));
                despesa.setValorPago(parseMoeda(dados[19].trim()));
                despesa.setDataPagamento(parseData(dados[20].trim()));
                
                despesa.setHistoricoObjetivo(dados[21].trim());
                despesa.setModalidadeLicitacao(dados[22].trim());

                despesasParaSalvar.add(despesa);
            }

            despesaRepository.saveAll(despesasParaSalvar);

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

    @Transactional
    public void excluirLote(String loteId) {
        List<DespesaEntity> paraExcluir = despesaRepository.findAll().stream()
                .filter(d -> loteId.equals(d.getIdImportacao())).toList();

        if (paraExcluir.isEmpty()) throw new IllegalArgumentException("Lote não encontrado: " + loteId);

        try {
            List<Map<String, Object>> dadosSimplificados = paraExcluir.stream().map(d -> {
                Map<String, Object> map = new HashMap<>();
                map.put("exercicio", d.getExercicio());
                map.put("numeroEmpenho", d.getNumeroEmpenho());
                map.put("valorEmpenhado", d.getValorEmpenhado());
                map.put("razaoSocial", d.getCredor() != null ? d.getCredor().getRazaoSocial() : "NÃO INFORMADO");
                return map;
            }).toList();

            String jsonExcluidos = objectMapper.writeValueAsString(dadosSimplificados);
            
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "EXCLUSAO_LOTE", 
                    "DESPESA", 
                    loteId, 
                    jsonExcluidos,
                    "Revogação total do lote. Itens removidos: " + paraExcluir.size()
            ));
            
            despesaRepository.deleteAllInBatch(paraExcluir);

        } catch (Exception e) {
            log.error("Erro ao processar reversão do lote {}", loteId, e);
            throw new RuntimeException("Falha ao auditar exclusão de lote: " + e.getMessage());
        }
    }

    private BigDecimal parseMoeda(String valor) {
        if (valor == null || valor.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(valor.replace(".", "").replace(",", "."));
    }

    private LocalDate parseData(String dataStr) {
        if (dataStr == null || dataStr.isBlank()) return null;
        try {
            return LocalDate.parse(dataStr, DATE_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }
}