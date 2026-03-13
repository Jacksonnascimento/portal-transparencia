package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.CredorEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.DespesaRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalDespesaService {

    private final DespesaRepository despesaRepository;
    private final ConfiguracaoRepository configuracaoRepository;
    private final ArmazenamentoService armazenamentoService;

    // --- 1. FÁBRICA DE BUSCAS DINÂMICAS (COM FILTRO DE PERÍODO) ---
    public Specification<DespesaEntity> criarSpecificationDespesa(
            Integer ano, 
            String credorBusca, 
            String numeroEmpenho, 
            String elementoDespesa,
            LocalDate dataInicio, // NOVO
            LocalDate dataFim     // NOVO
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filtro por Exercício
            if (ano != null) {
                predicates.add(cb.equal(root.get("exercicio"), ano));
            }

            // --- FILTRO DE PERÍODO (DATA DE EMPENHO) ---
            if (dataInicio != null && dataFim != null) {
                predicates.add(cb.between(root.get("dataEmpenho"), dataInicio, dataFim));
            } else if (dataInicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dataEmpenho"), dataInicio));
            } else if (dataFim != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dataEmpenho"), dataFim));
            }

            // Filtro por Empenho
            if (numeroEmpenho != null && !numeroEmpenho.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("numeroEmpenho")), "%" + numeroEmpenho.toLowerCase() + "%"));
            }

            // Filtro por Elemento
            if (elementoDespesa != null && !elementoDespesa.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("elementoDespesa")), "%" + elementoDespesa.toLowerCase() + "%"));
            }

            // Filtro por Credor (Busca por Nome ou Documento)
            if (credorBusca != null && !credorBusca.isBlank()) {
                Join<DespesaEntity, CredorEntity> credorJoin = root.join("credor", JoinType.INNER);
                Predicate nomeSemelhante = cb.like(cb.lower(credorJoin.get("razaoSocial")), "%" + credorBusca.toLowerCase() + "%");
                
                String apenasNumeros = credorBusca.replaceAll("\\D", "");
                if (!apenasNumeros.isEmpty()) {
                    predicates.add(cb.or(nomeSemelhante, cb.equal(credorJoin.get("cpfCnpj"), apenasNumeros)));
                } else {
                    predicates.add(nomeSemelhante);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // --- 2. GERAÇÃO DE CSV (DADOS ABERTOS) ---
    @Transactional(readOnly = true)
    public void gerarCsvDespesa(Specification<DespesaEntity> spec, PrintWriter writer) {
        List<DespesaEntity> despesas = despesaRepository.findAll(spec);
        
        // BOM para Excel identificar UTF-8
        writer.write('\ufeff');
        writer.println("exercicio;numero_empenho;data_empenho;orgao;credor;cpf_cnpj;elemento_despesa;valor_empenhado;valor_liquidado;valor_pago");
        
        for (DespesaEntity entity : despesas) {
            String credorNome = entity.getCredor() != null ? entity.getCredor().getRazaoSocial() : "NÃO INFORMADO";
            String credorDoc = entity.getCredor() != null ? mascararCpfCnpj(entity.getCredor().getCpfCnpj()) : "";

            writer.printf("%s;%s;%s;%s;%s;%s;%s;%s;%s;%s%n",
                    entity.getExercicio(),
                    safeCsvField(entity.getNumeroEmpenho()),
                    entity.getDataEmpenho() != null ? entity.getDataEmpenho().toString() : "",
                    safeCsvField(entity.getOrgaoNome()),
                    safeCsvField(credorNome),
                    credorDoc,
                    safeCsvField(entity.getElementoDespesa()),
                    formatarMoeda(entity.getValorEmpenhado()),
                    formatarMoeda(entity.getValorLiquidado()),
                    formatarMoeda(entity.getValorPago())
            );
        }
    }

    // --- 3. GERAÇÃO DE PDF (FORMATO RELATÓRIO) ---
    @Transactional(readOnly = true)
    public void gerarPdfDespesa(Specification<DespesaEntity> spec, HttpServletResponse response) throws Exception {
        List<DespesaEntity> despesas = despesaRepository.findAll(spec);
        Document document = new Document(PageSize.A4.rotate()); // Modo Paisagem para caber colunas
        PdfWriter.getInstance(document, response.getOutputStream());
        document.open();

        ConfiguracaoEntity config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
        adicionarCabecalhoPdf(document, config);

        Paragraph titulo = new Paragraph("RELATÓRIO DE DESPESAS PÚBLICAS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
        titulo.setAlignment(Element.ALIGN_CENTER);
        document.add(titulo);
        document.add(new Paragraph("\n"));

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{1f, 1.5f, 3f, 2f, 1.5f, 1.5f, 1.5f});

        String[] headers = {"Exerc.", "Empenho", "Favorecido", "Elemento", "Empenhado", "Liquidado", "Pago"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
            cell.setBackgroundColor(new Color(15, 23, 42)); // slate-900
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        Font fontDados = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (DespesaEntity d : despesas) {
            table.addCell(new PdfPCell(new Phrase(d.getExercicio().toString(), fontDados)));
            table.addCell(new PdfPCell(new Phrase(d.getNumeroEmpenho(), fontDados)));
            table.addCell(new PdfPCell(new Phrase(d.getCredor() != null ? d.getCredor().getRazaoSocial() : "---", fontDados)));
            table.addCell(new PdfPCell(new Phrase(d.getElementoDespesa(), fontDados)));
            table.addCell(createRightAlignedCell(formatarMoeda(d.getValorEmpenhado()), fontDados));
            table.addCell(createRightAlignedCell(formatarMoeda(d.getValorLiquidado()), fontDados));
            table.addCell(createRightAlignedCell(formatarMoeda(d.getValorPago()), fontDados));
        }

        document.add(table);
        document.close();
    }

    // --- MÉTODOS AUXILIARES ---
    private void adicionarCabecalhoPdf(Document doc, ConfiguracaoEntity config) throws Exception {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100f);
        header.setWidths(new float[]{1f, 5f});
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);

        if (config != null && config.getUrlBrasao() != null) {
            try {
                String path = config.getUrlBrasao().replace("/api/v1/portal/arquivos/", "");
                Resource res = armazenamentoService.carregar("geral", path);
                if (res.exists()) {
                    Image img = Image.getInstance(res.getFile().getAbsolutePath());
                    img.scaleToFit(50, 50);
                    logoCell.addElement(img);
                }
            } catch (Exception e) { log.warn("Brasão não encontrado para o PDF"); }
        }
        header.addCell(logoCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(Rectangle.NO_BORDER);
        textCell.addElement(new Paragraph(config != null ? config.getNomeEntidade() : "Portal da Transparência", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
        header.addCell(textCell);
        doc.add(header);
    }

    private PdfPCell createRightAlignedCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }

    private String safeCsvField(String value) { 
        return value == null ? "" : value.replace(";", ","); 
    }

    private String mascararCpfCnpj(String doc) {
        if (doc == null || doc.isBlank()) return "---";
        if (doc.length() == 11) return "***." + doc.substring(3, 6) + ".***-**";
        return doc.substring(0, 3) + ".***.***/****-" + doc.substring(doc.length() - 2);
    }

    private String formatarMoeda(java.math.BigDecimal valor) {
        return (valor == null) ? "0,00" : String.format("%.2f", valor).replace(".", ",");
    }
}