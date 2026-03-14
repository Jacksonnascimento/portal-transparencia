package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.application.dto.folhapagamento.FolhaEstatisticaDTO;
import br.com.horizon.portal.application.dto.folhapagamento.FolhaPagamentoAdminDTO;
import br.com.horizon.portal.application.dto.folhapagamento.FolhaPagamentoPublicoDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.FolhaPagamentoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.ServidorEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.FolhaPagamentoRepository;
import br.com.horizon.portal.infrastructure.persistence.repository.ServidorRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FolhaPagamentoService {

    private final FolhaPagamentoRepository folhaPagamentoRepository;
    private final ServidorRepository servidorRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ConfiguracaoService configuracaoService;
    private final ArmazenamentoService armazenamentoService;

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat
            .getCurrencyInstance(Locale.forLanguageTag("pt-BR"));
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    // --- DASHBOARD E ESTATÍSTICAS ---

    @Transactional(readOnly = true)
    public FolhaEstatisticaDTO obterEstatistica(Integer exercicio, Integer mes) {
        BigDecimal totalBruto = nullSafe(folhaPagamentoRepository.sumRemuneracaoBruta(exercicio, mes));
        BigDecimal totalIndenizatorio = nullSafe(folhaPagamentoRepository.sumVerbasIndenizatorias(exercicio, mes));
        BigDecimal totalDescontos = nullSafe(folhaPagamentoRepository.sumDescontosLegais(exercicio, mes));
        BigDecimal totalLiquido = nullSafe(folhaPagamentoRepository.sumSalarioLiquido(exercicio, mes));
        Long qtdServidores = folhaPagamentoRepository.countServidoresPagos(exercicio, mes);
        BigDecimal maiorSalario = nullSafe(folhaPagamentoRepository.findMaxSalarioLiquido(exercicio, mes));

        BigDecimal mediaLiquida = (qtdServidores > 0)
                ? totalLiquido.divide(BigDecimal.valueOf(qtdServidores), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, BigDecimal> distribuicaoVinculo = folhaPagamentoRepository
                .findDistribuicaoPorVinculo(exercicio, mes)
                .stream().collect(Collectors.toMap(
                        FolhaPagamentoRepository.DistribuicaoGasto::getNome,
                        FolhaPagamentoRepository.DistribuicaoGasto::getValor));

        Map<String, BigDecimal> distribuicaoLotacao = folhaPagamentoRepository
                .findDistribuicaoPorLotacao(exercicio, mes)
                .stream().collect(Collectors.toMap(
                        FolhaPagamentoRepository.DistribuicaoGasto::getNome,
                        FolhaPagamentoRepository.DistribuicaoGasto::getValor));

        return FolhaEstatisticaDTO.builder()
                .exercicio(exercicio).mes(mes)
                .totalRemuneracaoBruta(totalBruto)
                .totalVerbasIndenizatorias(totalIndenizatorio)
                .totalDescontosLegais(totalDescontos)
                .totalSalarioLiquido(totalLiquido)
                .quantidadeServidoresPagos(qtdServidores)
                .mediaSalarialLiquida(mediaLiquida)
                .maiorSalarioLiquido(maiorSalario)
                .distribuicaoPorTipoVinculo(distribuicaoVinculo)
                .distribuicaoPorLotacao(distribuicaoLotacao)
                .build();
    }

    // --- ENDPOINTS PÚBLICOS ---

    @Transactional(readOnly = true)
    public Page<FolhaPagamentoPublicoDTO> listarPublico(String nomeServidor, Integer exercicio, Integer mes,
            Pageable pageable) {
        Specification<FolhaPagamentoEntity> spec = construirFiltros(nomeServidor, exercicio, mes);
        return folhaPagamentoRepository.findAll(spec, pageable).map(this::mapToPublicoDTO);
    }

    @Transactional
    public byte[] exportarPublicoCsv(String nomeServidor, Integer exercicio, Integer mes) {
        List<FolhaPagamentoEntity> lista = folhaPagamentoRepository
                .findAll(construirFiltros(nomeServidor, exercicio, mes));
        StringBuilder csv = new StringBuilder(
                "\ufeffServidor;Cargo;Exercício;Mês;Bruto;Indenizações;Descontos;Líquido\n");

        for (FolhaPagamentoEntity f : lista) {
            csv.append(f.getServidor().getNome()).append(";")
                    .append(f.getServidor().getCargo()).append(";")
                    .append(f.getExercicio()).append(";")
                    .append(f.getMes()).append(";")
                    .append(f.getRemuneracaoBruta()).append(";")
                    .append(f.getVerbasIndenizatorias()).append(";")
                    .append(f.getDescontosLegais()).append(";")
                    .append(f.getSalarioLiquido()).append("\n");
        }
        dispararAuditoria("EXPORTACAO_CSV_PUBLICO", "SISTEMA", null, "Exportação de folha via portal");
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    public byte[] exportarPublicoPdf(String nomeServidor, Integer exercicio, Integer mes) {
        List<FolhaPagamentoEntity> lista = folhaPagamentoRepository
                .findAll(construirFiltros(nomeServidor, exercicio, mes));
        dispararAuditoria("EXPORTACAO_PDF_PUBLICO", "SISTEMA", null, "Exportação de PDF via portal");
        return gerarPdfFolha(lista, true);
    }

    // --- ENDPOINTS PRIVADOS (ADMIN) ---

    @Transactional(readOnly = true)
    public Page<FolhaPagamentoAdminDTO> listarAdmin(String nomeServidor, Integer exercicio, Integer mes,
            Pageable pageable) {
        Specification<FolhaPagamentoEntity> spec = construirFiltros(nomeServidor, exercicio, mes);
        return folhaPagamentoRepository.findAll(spec, pageable).map(this::mapToAdminDTO);
    }

    @Transactional
    public byte[] exportarAdminCsv(String nomeServidor, Integer exercicio, Integer mes) {
        List<FolhaPagamentoEntity> lista = folhaPagamentoRepository
                .findAll(construirFiltros(nomeServidor, exercicio, mes));
        StringBuilder csv = new StringBuilder("\ufeffServidor;CPF;Matrícula;Exercício;Mês;Bruto;Líquido;Importação\n");

        for (FolhaPagamentoEntity f : lista) {
            csv.append(f.getServidor().getNome()).append(";")
                    .append(f.getServidor().getCpf()).append(";")
                    .append(f.getServidor().getMatricula() != null ? f.getServidor().getMatricula() : "").append(";")
                    .append(f.getExercicio()).append(";")
                    .append(f.getMes()).append(";")
                    .append(f.getRemuneracaoBruta()).append(";")
                    .append(f.getSalarioLiquido()).append(";")
                    .append(f.getIdImportacao()).append("\n");
        }
        dispararAuditoria("EXPORTACAO_CSV_ADMIN", "ADMIN", null, "Exportação administrativa de folha");
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    public byte[] exportarAdminPdf(String nomeServidor, Integer exercicio, Integer mes) {
        List<FolhaPagamentoEntity> lista = folhaPagamentoRepository
                .findAll(construirFiltros(nomeServidor, exercicio, mes));
        dispararAuditoria("EXPORTACAO_PDF_ADMIN", "ADMIN", null, "Exportação administrativa de PDF");
        return gerarPdfFolha(lista, false);
    }

    @Transactional
    public String importarFolhaCsv(MultipartFile file) {
        String idImportacao = "LOTE-FOLHA-" + System.currentTimeMillis();
        String usuarioAtual = getUsuarioLogado();
        int registros = 0;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            boolean head = true;
            List<FolhaPagamentoEntity> lote = new ArrayList<>();
            List<ServidorEntity> todosServidores = servidorRepository.findAll();

            while ((linha = br.readLine()) != null) {
                if (head) {
                    head = false;
                    continue;
                }
                String[] c = linha.split(";");
                if (c.length < 7)
                    continue;

                String cpf = c[0].replaceAll("\\D", "");
                ServidorEntity servidor = todosServidores.stream().filter(s -> s.getCpf().equals(cpf)).findFirst()
                        .orElse(null);

                if (servidor == null || folhaPagamentoRepository.existsByServidorIdAndExercicioAndMes(servidor.getId(),
                        Integer.parseInt(c[1].trim()), Integer.parseInt(c[2].trim())))
                    continue;

                lote.add(FolhaPagamentoEntity.builder()
                        .servidor(servidor).exercicio(Integer.parseInt(c[1].trim())).mes(Integer.parseInt(c[2].trim()))
                        .remuneracaoBruta(converterParaBigDecimal(c[3]))
                        .verbasIndenizatorias(converterParaBigDecimal(c[4]))
                        .descontosLegais(converterParaBigDecimal(c[5]))
                        .salarioLiquido(converterParaBigDecimal(c[6]))
                        .idImportacao(idImportacao).criadoPor(usuarioAtual).atualizadoPor(usuarioAtual)
                        .build());
                registros++;
            }
            folhaPagamentoRepository.saveAll(lote);
            dispararAuditoria("IMPORTACAO", idImportacao, null, Map.of("registros", registros));
            return idImportacao;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar CSV de Folha: " + e.getMessage());
        }
    }

    @Transactional
    public void desfazerImportacao(String idImportacao) {
        List<FolhaPagamentoEntity> excluidos = folhaPagamentoRepository.findAllByIdImportacao(idImportacao);
        
        // Extrai apenas os dados limpos (Evita erro de Proxy do Hibernate/Jackson)
        List<Map<String, Object>> dadosLimposAuditoria = excluidos.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("exercicio", f.getExercicio());
            map.put("mes", f.getMes());
            map.put("nomeServidor", f.getServidor() != null ? f.getServidor().getNome() : "Desconhecido");
            map.put("salarioLiquido", f.getSalarioLiquido());
            return map;
        }).collect(Collectors.toList());

        folhaPagamentoRepository.deleteByIdImportacao(idImportacao);
        dispararAuditoria("EXCLUSAO_LOTE", idImportacao, dadosLimposAuditoria, null);
    }
    
    // --- GERAÇÃO DE PDF INSTITUCIONAL ---

    private byte[] gerarPdfFolha(List<FolhaPagamentoEntity> lista, boolean publico) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ConfiguracaoDTO.Response config = configuracaoService.obterConfiguracao();
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1.5f, 8.5f });
            headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            if (config.urlBrasao() != null && !config.urlBrasao().isEmpty()) {
                try {
                    String nomeArquivo = config.urlBrasao().substring(config.urlBrasao().lastIndexOf("/") + 1);
                    Resource res = armazenamentoService.carregar("config", nomeArquivo);
                    Image logo = Image.getInstance(res.getURL());
                    logo.scaleToFit(70, 70);
                    PdfPCell logoCell = new PdfPCell(logo);
                    logoCell.setBorder(Rectangle.NO_BORDER);
                    headerTable.addCell(logoCell);
                } catch (Exception e) {
                    headerTable.addCell("");
                }
            } else {
                headerTable.addCell("");
            }

            PdfPCell infoCell = new PdfPCell();
            infoCell.setBorder(Rectangle.NO_BORDER);
            infoCell.addElement(new Paragraph(config.nomeEntidade().toUpperCase(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            infoCell.addElement(
                    new Paragraph("CNPJ: " + config.cnpj(), FontFactory.getFont(FontFactory.HELVETICA, 10)));
            headerTable.addCell(infoCell);
            document.add(headerTable);
            document.add(new Paragraph(
                    "__________________________________________________________________________________________________________________________________"));
            document.add(new Paragraph(" "));

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Paragraph title = new Paragraph(publico ? "PORTAL DA TRANSPARÊNCIA - FOLHA DE PAGAMENTO"
                    : "RELATÓRIO ADMINISTRATIVO - FOLHA DE PAGAMENTO", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 3, 1, 1, 1.5f, 1.5f, 1.5f, 1.5f });

            String[] headers = { "Servidor", "Ano", "Mês", "Bruto", "Indeniz.", "Descontos", "Líquido" };
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                table.addCell(cell);
            }

            for (FolhaPagamentoEntity f : lista) {
                table.addCell(new Phrase(f.getServidor().getNome(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(f.getExercicio().toString(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(f.getMes().toString(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(CURRENCY_FORMAT.format(f.getRemuneracaoBruta()),
                        FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(CURRENCY_FORMAT.format(f.getVerbasIndenizatorias()),
                        FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(CURRENCY_FORMAT.format(f.getDescontosLegais()),
                        FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(CURRENCY_FORMAT.format(f.getSalarioLiquido()),
                        FontFactory.getFont(FontFactory.HELVETICA, 8)));
            }
            document.add(table);

            Paragraph footer = new Paragraph(
                    "\nDocumento extraído do Portal da Transparência em: "
                            + LocalDateTime.now().format(TIMESTAMP_FORMATTER),
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8));
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de Folha", e);
            return new byte[0];
        }
    }

    // --- AUXILIARES E MAPPERS ---

    private FolhaPagamentoPublicoDTO mapToPublicoDTO(FolhaPagamentoEntity e) {
        return FolhaPagamentoPublicoDTO.builder().id(e.getId()).servidorId(e.getServidor().getId())
                .nomeServidor(e.getServidor().getNome()).cargoServidor(e.getServidor().getCargo())
                .exercicio(e.getExercicio()).mes(e.getMes()).remuneracaoBruta(e.getRemuneracaoBruta())
                .verbasIndenizatorias(e.getVerbasIndenizatorias()).descontosLegais(e.getDescontosLegais())
                .salarioLiquido(e.getSalarioLiquido()).build();
    }

    private FolhaPagamentoAdminDTO mapToAdminDTO(FolhaPagamentoEntity e) {
        return FolhaPagamentoAdminDTO.builder().id(e.getId()).servidorId(e.getServidor().getId())
                .nomeServidor(e.getServidor().getNome()).matriculaServidor(e.getServidor().getMatricula())
                .cargoServidor(e.getServidor().getCargo()).exercicio(e.getExercicio()).mes(e.getMes())
                .remuneracaoBruta(e.getRemuneracaoBruta()).verbasIndenizatorias(e.getVerbasIndenizatorias())
                .descontosLegais(e.getDescontosLegais()).salarioLiquido(e.getSalarioLiquido())
                .idImportacao(e.getIdImportacao()).criadoPor(e.getCriadoPor()).criadoEm(e.getCriadoEm()).build();
    }

    private void dispararAuditoria(String acao, String id, Object ant, Object dnv) {
        try {
            eventPublisher.publishEvent(new LogAuditoriaEvent(acao, "FOLHA_PAGAMENTO", id, ant, dnv));
        } catch (Exception ex) {
            log.error("Erro Auditoria Folha", ex);
        }
    }

    private Specification<FolhaPagamentoEntity> construirFiltros(String n, Integer e, Integer m) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            Join<FolhaPagamentoEntity, ServidorEntity> join = root.join("servidor", JoinType.INNER);
            if (n != null && !n.isBlank())
                p.add(cb.like(cb.lower(join.get("nome")), "%" + n.toLowerCase() + "%"));
            if (e != null)
                p.add(cb.equal(root.get("exercicio"), e));
            if (m != null)
                p.add(cb.equal(root.get("mes"), m));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    private BigDecimal converterParaBigDecimal(String v) {
        if (v == null || v.isBlank())
            return BigDecimal.ZERO;
        return new BigDecimal(v.replace(".", "").replace(",", ".").trim());
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String getUsuarioLogado() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SISTEMA";
        }
    }
}