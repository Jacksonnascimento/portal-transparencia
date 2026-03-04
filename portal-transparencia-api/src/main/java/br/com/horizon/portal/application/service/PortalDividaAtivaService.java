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

        ConfiguracaoEntity config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
        String nomeOrgao = (config != null && config.getNomeEntidade() != null) ? config.getNomeEntidade() : "Portal da Transparência";

        document.add(new Paragraph(nomeOrgao, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
        document.add(new Paragraph("RELAÇÃO DE INSCRITOS NA DÍVIDA ATIVA\n\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{1f, 3f, 2f, 2f, 1.5f});

        String[] cabecalhos = {"Ano", "Nome do Devedor", "CPF/CNPJ", "Tipo de Dívida", "Valor (R$)"};
        for (String cabecalho : cabecalhos) {
            PdfPCell cell = new PdfPCell(new Phrase(cabecalho, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
            cell.setBackgroundColor(new Color(15, 23, 42));
            table.addCell(cell);
        }

        Font fontDados = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (DividaAtivaEntity entity : dividas) {
            table.addCell(new Phrase(String.valueOf(entity.getAnoInscricao()), fontDados));
            table.addCell(new Phrase(entity.getNomeDevedor(), fontDados));
            table.addCell(new Phrase(mascararCpfCnpj(entity.getCpfCnpj()), fontDados));
            table.addCell(new Phrase(entity.getTipoDivida() != null ? entity.getTipoDivida() : "", fontDados));
            table.addCell(new Phrase(entity.getValorTotalDivida().toString().replace(".", ","), fontDados));
        }

        document.add(table);
        document.close();
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