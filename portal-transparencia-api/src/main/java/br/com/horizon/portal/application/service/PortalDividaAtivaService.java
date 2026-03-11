package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.DividaAtivaRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalDividaAtivaService {

    private final DividaAtivaRepository dividaAtivaRepository;
    private final ConfiguracaoRepository configuracaoRepository;
    
    // INJEÇÃO DA NOSSA NOVA ESTRUTURA DE ARQUIVOS
    private final ArmazenamentoService armazenamentoService;

    public Specification<DividaAtivaEntity> criarSpecificationDivida(String nome, Integer ano) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (ano != null) predicates.add(cb.equal(root.get("anoInscricao"), ano));
            if (nome != null && !nome.isBlank()) predicates.add(cb.like(cb.lower(root.get("nomeDevedor")), "%" + nome.toLowerCase() + "%"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional(readOnly = true)
    public void gerarCsvDivida(Specification<DividaAtivaEntity> spec, PrintWriter writer) {
        List<DividaAtivaEntity> dividas = dividaAtivaRepository.findAll(spec);
        
        // BOM para corrigir acentuação no Excel
        writer.write('\ufeff');
        writer.println("ano_inscricao;nome_devedor;cpf_cnpj;tipo_divida;valor_total_divida");

        for (DividaAtivaEntity entity : dividas) {
            writer.printf("%s;%s;%s;%s;%s%n",
                    entity.getAnoInscricao(),
                    safeCsvField(entity.getNomeDevedor()),
                    mascararCpfCnpj(entity.getCpfCnpj()), // Aplica máscara LGPD na exportação pública
                    safeCsvField(entity.getTipoDivida()),
                    entity.getValorTotalDivida().toString().replace(".", ",")
            );
        }
    }

    @Transactional(readOnly = true)
    public void gerarPdfDivida(Specification<DividaAtivaEntity> spec, HttpServletResponse response) throws Exception {
        List<DividaAtivaEntity> dividas = dividaAtivaRepository.findAll(spec);
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, response.getOutputStream());
        document.open();

        // --- 1. BUSCAR CONFIGURAÇÕES DO PORTAL ---
        ConfiguracaoEntity config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
        String nomeOrgao = (config != null && config.getNomeEntidade() != null) ? config.getNomeEntidade() : "Portal da Transparência";
        String cnpjOrgao = (config != null && config.getCnpj() != null) ? "CNPJ: " + config.getCnpj() : "";

        // --- 2. MONTAR CABEÇALHO PADRÃO OURO ---
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100f);
        headerTable.setWidths(new float[] { 1f, 5f });

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        // NOVA LÓGICA DO BRASÃO
        if (config != null && config.getUrlBrasao() != null && config.getUrlBrasao().contains("/api/v1/portal/arquivos/")) {
            try {
                String urlRelativa = config.getUrlBrasao().replace("/api/v1/portal/arquivos/", "");
                String[] partes = urlRelativa.split("/");
                
                Resource resource = null;
                if (partes.length == 2) {
                    resource = armazenamentoService.carregar(partes[0], partes[1]);
                } else if (partes.length == 1) {
                    resource = armazenamentoService.carregar("geral", partes[0]); 
                }

                if (resource != null && resource.exists()) {
                    Image brasao = Image.getInstance(resource.getFile().getAbsolutePath());
                    brasao.scaleToFit(50, 50);
                    logoCell.addElement(brasao);
                }
            } catch (Exception e) {
                log.warn("Falha ao carregar a imagem do brasão dinamicamente para o PDF de Dívida Ativa.", e);
            }
        }

        headerTable.addCell(logoCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(Rectangle.NO_BORDER);
        textCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        textCell.addElement(new Paragraph(nomeOrgao, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY)));
        
        if (!cnpjOrgao.isEmpty()) {
            textCell.addElement(new Paragraph(cnpjOrgao, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));
        }

        headerTable.addCell(textCell);
        document.add(headerTable);
        document.add(new Paragraph("\n"));

        // --- 3. TÍTULOS ---
        Paragraph titulo = new Paragraph("RELAÇÃO DE INSCRITOS NA DÍVIDA ATIVA", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK));
        titulo.setAlignment(Element.ALIGN_CENTER);
        document.add(titulo);

        Paragraph subtitulo = new Paragraph("Total de Registros: " + dividas.size() + "\n\n", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY));
        subtitulo.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitulo);

        // --- 4. TABELA DE DADOS ---
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{1f, 3f, 2f, 2f, 1.5f});
        table.setSpacingBefore(10);

        String[] cabecalhos = {"Ano", "Nome do Devedor", "CPF/CNPJ", "Tipo de Dívida", "Valor (R$)"};
        for (String cabecalho : cabecalhos) {
            PdfPCell cell = new PdfPCell(new Phrase(cabecalho, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
            cell.setBackgroundColor(new Color(15, 23, 42)); // Padrão UI (slate-900)
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        Font fontDados = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (DividaAtivaEntity entity : dividas) {
            table.addCell(createPdfCell(String.valueOf(entity.getAnoInscricao()), fontDados));
            table.addCell(createPdfCell(entity.getNomeDevedor(), fontDados));
            table.addCell(createPdfCell(mascararCpfCnpj(entity.getCpfCnpj()), fontDados));
            table.addCell(createPdfCell(entity.getTipoDivida() != null ? entity.getTipoDivida() : "", fontDados));
            table.addCell(createPdfCell(entity.getValorTotalDivida().toString().replace(".", ","), fontDados));
        }

        document.add(table);
        document.close();
    }

    // MÉTODO AUXILIAR PARA PADRONIZAR AS CÉLULAS DA TABELA
    private PdfPCell createPdfCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(4);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private String safeCsvField(String value) {
        return value == null ? "" : value.replace(";", ",");
    }

    private String mascararCpfCnpj(String doc) {
        if (doc == null || doc.isBlank()) return "Não Informado";
        if (doc.length() > 11) return doc.substring(0, 3) + ".***.***/****-" + doc.substring(doc.length() - 2); // CNPJ
        return "***." + doc.substring(3, 6) + ".***-**"; // CPF
    }
}