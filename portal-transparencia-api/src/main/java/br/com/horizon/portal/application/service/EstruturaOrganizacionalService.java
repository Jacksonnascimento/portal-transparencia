package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.estrutura.EstruturaOrganizacionalDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.EstruturaOrganizacionalEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.EstruturaOrganizacionalRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EstruturaOrganizacionalService {

    private final EstruturaOrganizacionalRepository repository;
    private final ConfiguracaoRepository configuracaoRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    
    // Serviço de armazenamento injetado. Lida automaticamente com as subpastas.
    private final ArmazenamentoService armazenamentoService;

    private static final String ENTIDADE_NOME = "ESTRUTURA_ORGANIZACIONAL";

    public List<EstruturaOrganizacionalDTO> listarComFiltros(String nomeOrgao, String sigla, String nomeDirigente,
            String cargoDirigente) {
        String pOrgao = (nomeOrgao != null && !nomeOrgao.trim().isEmpty()) ? nomeOrgao : null;
        String pSigla = (sigla != null && !sigla.trim().isEmpty()) ? sigla : null;
        String pDirigente = (nomeDirigente != null && !nomeDirigente.trim().isEmpty()) ? nomeDirigente : null;
        String pCargo = (cargoDirigente != null && !cargoDirigente.trim().isEmpty()) ? cargoDirigente : null;

        return repository.buscarComFiltros(pOrgao, pSigla, pDirigente, pCargo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EstruturaOrganizacionalDTO criar(EstruturaOrganizacionalDTO dto, String usuarioLogado) {
        EstruturaOrganizacionalEntity entity = toEntity(dto);
        entity.setCriadoPor(usuarioLogado);
        EstruturaOrganizacionalEntity salva = repository.save(entity);
        dispararAuditoria("CRIACAO", salva.getId().toString(), null, salva);
        return toDTO(salva);
    }

    @Transactional
    public EstruturaOrganizacionalDTO atualizar(UUID id, EstruturaOrganizacionalDTO dto, String usuarioLogado) {
        EstruturaOrganizacionalEntity existente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Órgão/Secretaria não encontrado."));
        Map<String, Object> estadoAnterior = objectMapper.convertValue(existente,
                new TypeReference<Map<String, Object>>() {
                });

        // REGRA DE SAÚDE DO SERVIDOR: Verifica se a foto mudou ou foi removida.
        if (existente.getUrlFotoDirigente() != null && !existente.getUrlFotoDirigente().equals(dto.getUrlFotoDirigente())) {
            armazenamentoService.apagar(existente.getUrlFotoDirigente());
        }

        existente.setNomeOrgao(dto.getNomeOrgao());
        existente.setSigla(dto.getSigla());
        existente.setNomeDirigente(dto.getNomeDirigente());
        existente.setCargoDirigente(dto.getCargoDirigente());
        existente.setHorarioAtendimento(dto.getHorarioAtendimento());
        existente.setEnderecoCompleto(dto.getEnderecoCompleto());
        existente.setTelefoneContato(dto.getTelefoneContato());
        existente.setEmailInstitucional(dto.getEmailInstitucional());
        existente.setLinkCurriculo(dto.getLinkCurriculo());
        
        existente.setUrlFotoDirigente(dto.getUrlFotoDirigente());
        
        existente.setAtualizadoPor(usuarioLogado);
        existente.setAtualizadoEm(LocalDateTime.now());

        EstruturaOrganizacionalEntity salva = repository.save(existente);
        dispararAuditoria("ATUALIZACAO", salva.getId().toString(), estadoAnterior, salva);
        return toDTO(salva);
    }

    @Transactional
    public void excluir(UUID id, String usuarioLogado) {
        EstruturaOrganizacionalEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Órgão/Secretaria não encontrado."));
        Map<String, Object> estadoAnterior = objectMapper.convertValue(entity,
                new TypeReference<Map<String, Object>>() {
                });
                
        // REGRA DE SAÚDE DO SERVIDOR: Ao deletar o órgão, limpa o arquivo físico da foto no disco
        if (entity.getUrlFotoDirigente() != null) {
            armazenamentoService.apagar(entity.getUrlFotoDirigente());
        }
        
        repository.delete(entity);
        dispararAuditoria("EXCLUSAO", id.toString(), estadoAnterior, null);
    }

    @Transactional(readOnly = true)
    public void gerarCsvEstrutura(String nomeOrgao, String sigla, String nomeDirigente, String cargoDirigente,
            PrintWriter writer) {
        List<EstruturaOrganizacionalDTO> estruturas = listarComFiltros(nomeOrgao, sigla, nomeDirigente, cargoDirigente);
        writer.write('\ufeff');
        writer.println("orgao;sigla;dirigente;cargo;telefone;email;link_curriculo");

        for (EstruturaOrganizacionalDTO entity : estruturas) {
            writer.printf("%s;%s;%s;%s;%s;%s;%s%n",
                    safeCsvField(entity.getNomeOrgao()), safeCsvField(entity.getSigla()),
                    safeCsvField(entity.getNomeDirigente()), safeCsvField(entity.getCargoDirigente()),
                    safeCsvField(entity.getTelefoneContato()), safeCsvField(entity.getEmailInstitucional()),
                    safeCsvField(entity.getLinkCurriculo()));
        }
    }

    @Transactional(readOnly = true)
    public void gerarPdfEstrutura(String nomeOrgao, String sigla, String nomeDirigente, String cargoDirigente,
            HttpServletResponse response) throws Exception {
        List<EstruturaOrganizacionalDTO> estruturas = listarComFiltros(nomeOrgao, sigla, nomeDirigente, cargoDirigente);

        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, response.getOutputStream());
        document.open();

        ConfiguracaoEntity config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
        String nomeEntidade = (config != null && config.getNomeEntidade() != null) ? config.getNomeEntidade()
                : "Portal da Transparência";
        String cnpjOrgao = (config != null && config.getCnpj() != null) ? "CNPJ: " + config.getCnpj() : "";

        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100f);
        headerTable.setWidths(new float[] { 1f, 6f });

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        // NOVA LÓGICA DO BRASÃO: Dinâmica, baseada no Banco de Dados e isolada no ArmazenamentoService
        if (config != null && config.getUrlBrasao() != null && config.getUrlBrasao().contains("/api/v1/portal/arquivos/")) {
            try {
                // Extrai apenas o miolo relativo (ex: "config/uuid.png")
                String urlRelativa = config.getUrlBrasao().replace("/api/v1/portal/arquivos/", "");
                String[] partes = urlRelativa.split("/");
                
                Resource resource = null;
                if (partes.length == 2) {
                    resource = armazenamentoService.carregar(partes[0], partes[1]);
                } else if (partes.length == 1) {
                    resource = armazenamentoService.carregar("geral", partes[0]); // fallback de segurança
                }

                if (resource != null && resource.exists()) {
                    Image brasao = Image.getInstance(resource.getFile().getAbsolutePath());
                    brasao.scaleToFit(50, 50);
                    logoCell.addElement(brasao);
                }
            } catch (Exception e) {
                log.warn("Falha ao carregar a imagem do brasão dinamicamente para o PDF a partir do Storage.", e);
            }
        }

        headerTable.addCell(logoCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(Rectangle.NO_BORDER);
        textCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        textCell.addElement(
                new Paragraph(nomeEntidade, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY)));
        if (!cnpjOrgao.isEmpty())
            textCell.addElement(new Paragraph(cnpjOrgao, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));

        headerTable.addCell(textCell);
        document.add(headerTable);
        document.add(new Paragraph("\n"));

        Paragraph titulo = new Paragraph("ESTRUTURA ORGANIZACIONAL E DIRIGENTES",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK));
        titulo.setAlignment(Element.ALIGN_CENTER);
        document.add(titulo);

        Paragraph subtitulo = new Paragraph("Total de Órgãos: " + estruturas.size() + "\n\n",
                FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY));
        subtitulo.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitulo);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100f);
        table.setWidths(new float[] { 3.5f, 2.5f, 2f, 2f });
        table.setSpacingBefore(10);

        String[] cabecalhos = { "Órgão / Secretaria", "Dirigente", "Cargo", "Contatos" };
        for (String cab : cabecalhos) {
            PdfPCell cell = new PdfPCell(
                    new Phrase(cab, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
            cell.setBackgroundColor(new Color(15, 23, 42));
            cell.setPadding(5);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        Font fontDados = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (EstruturaOrganizacionalDTO entity : estruturas) {
            String orgaoFormatado = entity.getNomeOrgao();
            if (entity.getSigla() != null && !entity.getSigla().isEmpty()) {
                orgaoFormatado += " (" + entity.getSigla() + ")";
            }

            String contatos = "";
            if (entity.getTelefoneContato() != null && !entity.getTelefoneContato().isEmpty())
                contatos += "Tel: " + entity.getTelefoneContato() + "\n";
            if (entity.getEmailInstitucional() != null && !entity.getEmailInstitucional().isEmpty())
                contatos += entity.getEmailInstitucional();

            PdfPCell c1 = new PdfPCell(new Phrase(orgaoFormatado != null ? orgaoFormatado : "", fontDados));
            PdfPCell c2 = new PdfPCell(
                    new Phrase(entity.getNomeDirigente() != null ? entity.getNomeDirigente() : "", fontDados));
            PdfPCell c3 = new PdfPCell(
                    new Phrase(entity.getCargoDirigente() != null ? entity.getCargoDirigente() : "", fontDados));
            PdfPCell c4 = new PdfPCell(new Phrase(contatos, fontDados));

            c1.setPadding(4);
            c2.setPadding(4);
            c3.setPadding(4);
            c4.setPadding(4);

            table.addCell(c1);
            table.addCell(c2);
            table.addCell(c3);
            table.addCell(c4);
        }

        document.add(table);
        document.close();
    }

    private String safeCsvField(String value) {
        if (value == null)
            return "";
        return value.replace("\n", " ").replace("\r", " ").replace(";", ",");
    }

    private void dispararAuditoria(String acao, String entidadeId, Object dadosAnteriores, Object dadosNovos) {
        try {
            eventPublisher
                    .publishEvent(new LogAuditoriaEvent(acao, ENTIDADE_NOME, entidadeId, dadosAnteriores, dadosNovos));
        } catch (Exception e) {
            log.error("Erro ao gerar log de auditoria.", e);
        }
    }

    private EstruturaOrganizacionalDTO toDTO(EstruturaOrganizacionalEntity entity) {
        return EstruturaOrganizacionalDTO.builder()
                .id(entity.getId()).nomeOrgao(entity.getNomeOrgao()).sigla(entity.getSigla())
                .nomeDirigente(entity.getNomeDirigente()).cargoDirigente(entity.getCargoDirigente())
                .horarioAtendimento(entity.getHorarioAtendimento()).enderecoCompleto(entity.getEnderecoCompleto())
                .telefoneContato(entity.getTelefoneContato()).emailInstitucional(entity.getEmailInstitucional())
                .linkCurriculo(entity.getLinkCurriculo())
                .urlFotoDirigente(entity.getUrlFotoDirigente())
                .criadoEm(entity.getCriadoEm())
                .atualizadoEm(entity.getAtualizadoEm())
                .build();
    }

    private EstruturaOrganizacionalEntity toEntity(EstruturaOrganizacionalDTO dto) {
        return EstruturaOrganizacionalEntity.builder()
                .nomeOrgao(dto.getNomeOrgao()).sigla(dto.getSigla()).nomeDirigente(dto.getNomeDirigente())
                .cargoDirigente(dto.getCargoDirigente()).horarioAtendimento(dto.getHorarioAtendimento())
                .enderecoCompleto(dto.getEnderecoCompleto()).telefoneContato(dto.getTelefoneContato())
                .emailInstitucional(dto.getEmailInstitucional()).linkCurriculo(dto.getLinkCurriculo())
                .urlFotoDirigente(dto.getUrlFotoDirigente())
                .build();
    }
}