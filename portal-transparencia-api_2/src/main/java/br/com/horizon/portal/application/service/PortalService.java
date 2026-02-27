package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.ReceitaRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
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
import java.io.File; // Import adicionado para leitura de diretório
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalService {

    private final ReceitaRepository receitaRepository;
    private final ConfiguracaoRepository configuracaoRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public Specification<ReceitaEntity> criarSpecificationReceita(Integer exercicio, String origem, String categoria,
                                                                  String fonte, LocalDate start, LocalDate end) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (exercicio != null) predicates.add(cb.equal(root.get("exercicio"), exercicio));
            if (origem != null && !origem.isBlank()) predicates.add(cb.like(cb.lower(root.get("origem")), "%" + origem.toLowerCase() + "%"));
            if (categoria != null && !categoria.isBlank()) predicates.add(cb.like(cb.lower(root.get("categoriaEconomica")), "%" + categoria.toLowerCase() + "%"));
            if (fonte != null && !fonte.isBlank()) predicates.add(cb.like(cb.lower(root.get("fonteRecursos")), "%" + fonte.toLowerCase() + "%"));
            if (start != null) predicates.add(cb.greaterThanOrEqualTo(root.get("dataLancamento"), start));
            if (end != null) predicates.add(cb.lessThanOrEqualTo(root.get("dataLancamento"), end));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional(readOnly = true)
    public void gerarCsvReceitas(Specification<ReceitaEntity> spec, PrintWriter writer) {
        log.info("Iniciando geração de CSV de Receitas (Dados Abertos)...");
        List<ReceitaEntity> receitas = receitaRepository.findAll(spec);

        writer.write('\ufeff');
        writer.println("exercicio;mes;data_lancamento;categoria_economica;origem;especie;rubrica;alinea;fonte_recursos;valor_previsto_inicial;valor_previsto_atualizado;valor_arrecadado;historico");

        for (ReceitaEntity entity : receitas) {
            writer.printf("%s;%s;%s;%s;%s;%s;%s;%s;%s;%s;%s;%s;%s%n",
                    safeString(entity.getExercicio()),
                    safeString(entity.getMes()),
                    entity.getDataLancamento() != null ? entity.getDataLancamento().format(DATE_FORMATTER) : "",
                    safeCsvField(entity.getCategoriaEconomica()),
                    safeCsvField(entity.getOrigem()),
                    safeCsvField(entity.getEspecie()),
                    safeCsvField(entity.getRubrica()),
                    safeCsvField(entity.getAlinea()),
                    safeCsvField(entity.getFonteRecursos()),
                    safeNumber(entity.getValorPrevistoInicial()),
                    safeNumber(entity.getValorPrevistoAtualizado()),
                    safeNumber(entity.getValorArrecadado()),
                    safeCsvField(entity.getHistorico())
            );
        }
    }

    @Transactional(readOnly = true)
    public void gerarPdfReceitas(Specification<ReceitaEntity> spec, HttpServletResponse response) throws Exception {
        log.info("Iniciando geração de PDF de Receitas...");

        List<ReceitaEntity> receitas = receitaRepository.findAll(spec);

        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, response.getOutputStream());
        document.open();

        // --- 1. BUSCAR CONFIGURAÇÕES DO PORTAL ---
        ConfiguracaoEntity config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
        String nomeOrgao = (config != null && config.getNomeEntidade() != null) ? config.getNomeEntidade() : "Órgão Público - Portal da Transparência";
        String cnpjOrgao = (config != null && config.getCnpj() != null) ? "CNPJ: " + config.getCnpj() : "";
        String enderecoOrgao = (config != null && config.getEndereco() != null) ? config.getEndereco() : "";

        // --- 2. MONTAR CABEÇALHO OFICIAL (Logo + Textos) ---
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100f);
        headerTable.setWidths(new float[]{1f, 6f});

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        
        // CORREÇÃO: Busca dinâmica da imagem usando a mesma lógica do seu ConfiguracaoController
        try {
            String path = System.getProperty("user.dir") + File.separator + "Imagens";
            File folder = new File(path);
            
            if (folder.exists()) {
                File[] files = folder.listFiles((dir, name) -> name.startsWith("brasao"));
                if (files != null && files.length > 0) {
                    // Pega dinamicamente o arquivo encontrado (brasao.png, brasao.jpg, etc)
                    Image brasao = Image.getInstance(files[0].getAbsolutePath());
                    brasao.scaleToFit(50, 50);
                    logoCell.addElement(brasao);
                } else {
                    log.warn("Arquivo de brasão não encontrado no diretório. PDF gerado sem logo.");
                }
            }
        } catch (Exception e) {
            log.warn("Falha ao carregar a imagem do brasão dinamicamente. Gerando sem logo.", e);
        }
        
        headerTable.addCell(logoCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        textCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        textCell.addElement(new Paragraph(nomeOrgao, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY)));
        if (!cnpjOrgao.isEmpty()) textCell.addElement(new Paragraph(cnpjOrgao, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));
        if (!enderecoOrgao.isEmpty()) textCell.addElement(new Paragraph(enderecoOrgao, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));
        
        headerTable.addCell(textCell);
        document.add(headerTable);
        document.add(new Paragraph("\n"));

        // --- 3. TÍTULO DO RELATÓRIO ---
        Paragraph titulo = new Paragraph("RELATÓRIO DE RECEITAS ARRECADADAS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK));
        titulo.setAlignment(Element.ALIGN_CENTER);
        document.add(titulo);

        Paragraph subtitulo = new Paragraph("Total de Registros Encontrados: " + receitas.size() + "\n\n", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY));
        subtitulo.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitulo);

        // --- 4. TABELA DE DADOS (9 Colunas Detalhadas) ---
        PdfPTable table = new PdfPTable(9);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{0.8f, 0.7f, 1.2f, 2.0f, 1.8f, 1.8f, 1.3f, 1.3f, 1.3f});
        table.setSpacingBefore(10);

        escreverCabecalhoTabelaPdf(table);

        Font fontDados = FontFactory.getFont(FontFactory.HELVETICA);
        fontDados.setSize(7);

        for (ReceitaEntity entity : receitas) {
            table.addCell(new Phrase(safeString(entity.getExercicio()), fontDados));
            table.addCell(new Phrase(safeString(entity.getMes()), fontDados));
            table.addCell(new Phrase(entity.getDataLancamento() != null ? entity.getDataLancamento().format(DATE_FORMATTER) : "", fontDados));
            table.addCell(new Phrase(safeString(entity.getCategoriaEconomica()), fontDados));
            table.addCell(new Phrase(safeString(entity.getOrigem()), fontDados));
            table.addCell(new Phrase(safeString(entity.getFonteRecursos()), fontDados));
            table.addCell(new Phrase(safeNumber(entity.getValorPrevistoInicial()), fontDados));
            table.addCell(new Phrase(safeNumber(entity.getValorPrevistoAtualizado()), fontDados));
            table.addCell(new Phrase(safeNumber(entity.getValorArrecadado()), fontDados));
        }

        document.add(table);
        document.close();
        
        log.info("Geração de PDF concluída. {} registros exportados.", receitas.size());
    }

    private void escreverCabecalhoTabelaPdf(PdfPTable table) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(15, 23, 42)); // Padrão UI (slate-900)
        cell.setPadding(5);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Font font = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        font.setColor(Color.WHITE);
        font.setSize(8);

        String[] cabecalhos = {"Exercício", "Mês", "Data Lanç.", "Categoria Econômica", "Origem", "Fonte Recursos", "Prev. Inicial", "Prev. Atual", "Arrecadado"};

        for (String cabecalho : cabecalhos) {
            cell.setPhrase(new Phrase(cabecalho, font));
            table.addCell(cell);
        }
    }

    // --- MÉTODOS UTILITÁRIOS PARA O CSV / PDF ---
    private String safeString(Object value) {
        return value == null ? "" : value.toString();
    }

    private String safeNumber(BigDecimal value) {
        return value == null ? "" : value.toString().replace(".", ",");
    }

    private String safeCsvField(String value) {
        if (value == null) return "";
        return value.replace("\n", " ").replace("\r", " ").replace(";", ",");
    }
}