package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DividaAtivaRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DividaAtivaService {

    private final DividaAtivaRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    // --- CRUD INDIVIDUAL COM AUDITORIA ---

    @Transactional
    public DividaAtivaEntity salvar(DividaAtivaEntity entity) {
        String acao = (entity.getId() == null) ? "CRIACAO" : "ATUALIZACAO";
        DividaAtivaEntity salvo = repository.save(entity);
        
        dispararLog(acao, salvo.getId().toString(), salvo, "Alteração individual via Painel Admin");
        return salvo;
    }

    @Transactional
    public void excluirIndividual(Long id) {
        DividaAtivaEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registro não encontrado: " + id));
        
        dispararLog("EXCLUSAO", id.toString(), entity, "Exclusão individual via Painel Admin");
        repository.delete(entity);
    }

    // --- INGESTÃO MASSIVA COM AUDITORIA ---

    @Transactional
    public void importarArquivoCsv(MultipartFile file) {
        String loteId = "LOTE-DIVIDA-" + System.currentTimeMillis();
        List<DividaAtivaEntity> registros = new ArrayList<>();
        int linhaAtual = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            br.readLine(); // Pula cabeçalho

            while ((linha = br.readLine()) != null) {
                linhaAtual++;
                if (linha.trim().isEmpty()) continue;
                String[] dados = linha.split(";", -1);

                if (dados.length < 5) throw new IllegalArgumentException("Linha " + linhaAtual + ": Colunas insuficientes.");

                DividaAtivaEntity entity = new DividaAtivaEntity();
                entity.setIdImportacao(loteId);
                entity.setNomeDevedor(dados[0].trim());
                entity.setCpfCnpj(dados[1].trim());
                entity.setValorTotalDivida(new BigDecimal(dados[2].trim().replace(".", "").replace(",", ".")));
                entity.setAnoInscricao(Integer.parseInt(dados[3].trim()));
                entity.setTipoDivida(dados[4].trim());

                registros.add(entity);
            }

            repository.saveAll(registros);

            // LOG DE IMPORTAÇÃO
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "IMPORTACAO_LOTE_CSV", 
                    "DIVIDA_ATIVA", 
                    loteId, 
                    null,
                    "Importação de " + registros.size() + " registros via CSV. Lote: " + loteId
            ));

        } catch (Exception e) {
            log.error("Erro na importação de Dívida Ativa", e);
            throw new RuntimeException("Falha ao processar CSV: " + e.getMessage());
        }
    }

    @Transactional
    public void excluirLote(String loteId) {
        List<DividaAtivaEntity> paraExcluir = repository.findAll().stream()
                .filter(d -> loteId.equals(d.getIdImportacao())).toList();

        if (paraExcluir.isEmpty()) throw new IllegalArgumentException("Lote não encontrado: " + loteId);

        try {
            String jsonExcluidos = objectMapper.writeValueAsString(paraExcluir);
            
            // LOG DE ROLLBACK
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "EXCLUSAO_LOTE", 
                    "DIVIDA_ATIVA", 
                    loteId, 
                    jsonExcluidos,
                    "Revogação total do lote. Itens removidos: " + paraExcluir.size()
            ));
            
            repository.deleteAll(paraExcluir);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao auditar exclusão de lote.");
        }
    }

    // --- MOTOR DE DISPARO DE LOGS ---
    private void dispararLog(String acao, String identificador, Object dado, String observacao) {
        try {
            String jsonEstado = objectMapper.writeValueAsString(dado);
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    acao,
                    "DIVIDA_ATIVA",
                    identificador,
                    jsonEstado,
                    observacao
            ));
        } catch (Exception e) {
            log.error("Falha ao gerar JSON de auditoria", e);
        }
    }

   
    
    @Transactional(readOnly = true)
    public List<Integer> listarAnosDisponiveis() {
        return repository.findAnosDisponiveis();
    }
}