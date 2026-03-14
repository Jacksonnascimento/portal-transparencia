package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.config.ConfiguracaoDTO;
import br.com.horizon.portal.application.dto.servidor.ServidorAdminDTO;
import br.com.horizon.portal.application.dto.servidor.ServidorPublicoDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ServidorEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ServidorRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
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
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServidorService {

    private final ServidorRepository servidorRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ConfiguracaoService configuracaoService;
    private final ArmazenamentoService armazenamentoService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    // --- ENDPOINTS PÚBLICOS ---

    @Transactional(readOnly = true)
    public Page<ServidorPublicoDTO> listarPublico(String nome, String cargo, String lotacao, Pageable pageable) {
        Specification<ServidorEntity> spec = construirFiltros(nome, cargo, lotacao);
        return servidorRepository.findAll(spec, pageable).map(this::mapToPublicoDTO);
    }

    @Transactional // CORREÇÃO: Removido readOnly = true para permitir gravação de auditoria
    public byte[] exportarPublicoCsv(String nome, String cargo, String lotacao) {
        List<ServidorEntity> lista = servidorRepository.findAll(construirFiltros(nome, cargo, lotacao));
        StringBuilder csv = new StringBuilder("\ufeffNome;CPF;Matrícula;Cargo;Lotação;Vínculo;Admissão\n");

        for (ServidorEntity s : lista) {
            csv.append(s.getNome()).append(";")
               .append(mascararCpf(s.getCpf())).append(";")
               .append(s.getMatricula() != null ? s.getMatricula() : "").append(";")
               .append(s.getCargo()).append(";")
               .append(s.getLotacao()).append(";")
               .append(s.getTipoVinculo()).append(";")
               .append(s.getDataAdmissao().format(DATE_FORMATTER)).append("\n");
        }
        dispararAuditoria("EXPORTACAO_CSV_PUBLICO", "SISTEMA", null, "Exportação de servidores via portal");
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional // CORREÇÃO: Removido readOnly = true
    public byte[] exportarPublicoPdf(String nome, String cargo, String lotacao) {
        List<ServidorEntity> lista = servidorRepository.findAll(construirFiltros(nome, cargo, lotacao));
        dispararAuditoria("EXPORTACAO_PDF_PUBLICO", "SISTEMA", null, "Exportação de PDF de servidores via portal");
        return gerarPdf(lista, true);
    }

    // --- ENDPOINTS PRIVADOS (ADMIN) ---

    @Transactional(readOnly = true)
    public Page<ServidorAdminDTO> listarAdmin(String nome, String cargo, String lotacao, Pageable pageable) {
        Specification<ServidorEntity> spec = construirFiltros(nome, cargo, lotacao);
        return servidorRepository.findAll(spec, pageable).map(this::mapToAdminDTO);
    }

    @Transactional // CORREÇÃO: Removido readOnly = true
    public byte[] exportarAdminCsv(String nome, String cargo, String lotacao) {
        List<ServidorEntity> lista = servidorRepository.findAll(construirFiltros(nome, cargo, lotacao));
        StringBuilder csv = new StringBuilder("\ufeffNome;CPF;Matrícula;Cargo;Lotação;Vínculo;Importação\n");

        for (ServidorEntity s : lista) {
            csv.append(s.getNome()).append(";")
               .append(s.getCpf()).append(";")
               .append(s.getMatricula() != null ? s.getMatricula() : "").append(";")
               .append(s.getCargo()).append(";")
               .append(s.getLotacao()).append(";")
               .append(s.getTipoVinculo()).append(";")
               .append(s.getIdImportacao()).append("\n");
        }
        dispararAuditoria("EXPORTACAO_CSV_ADMIN", "ADMIN", null, "Exportação completa de servidores");
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional // CORREÇÃO: Removido readOnly = true
    public byte[] exportarAdminPdf(String nome, String cargo, String lotacao) {
        List<ServidorEntity> lista = servidorRepository.findAll(construirFiltros(nome, cargo, lotacao));
        dispararAuditoria("EXPORTACAO_PDF_ADMIN", "ADMIN", null, "Exportação administrativa de PDF de servidores");
        return gerarPdf(lista, false);
    }

    // --- MOTOR DE IMPORTAÇÃO CSV ---

    @Transactional
    public String importarServidoresCsv(MultipartFile file) {
        String idImportacao = "LOTE-" + System.currentTimeMillis();
        String usuarioAtual = getUsuarioLogado();
        int registros = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            boolean head = true;
            List<ServidorEntity> lote = new ArrayList<>();

            while ((linha = br.readLine()) != null) {
                if (head) { head = false; continue; }
                String[] c = linha.split(";");
                if (c.length < 7) continue;

                String cpf = c[1].replaceAll("\\D", "");
                if (servidorRepository.existsByCpf(cpf)) continue;

                lote.add(ServidorEntity.builder()
                        .nome(c[0].trim()).cpf(cpf).matricula(c[2].trim())
                        .cargo(c[3].trim()).lotacao(c[4].trim()).tipoVinculo(c[5].trim())
                        .dataAdmissao(LocalDate.parse(c[6].trim(), DATE_FORMATTER))
                        .idImportacao(idImportacao).criadoPor(usuarioAtual).atualizadoPor(usuarioAtual)
                        .build());
                registros++;
            }
            servidorRepository.saveAll(lote);
            dispararAuditoria("IMPORTACAO", idImportacao, null, Map.of("registros", registros));
            return idImportacao;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar CSV: " + e.getMessage());
        }
    }

    @Transactional
    public void desfazerImportacao(String idImportacao) {
        servidorRepository.deleteByIdImportacao(idImportacao);
        dispararAuditoria("EXCLUSAO_LOTE", idImportacao, "Lote removido", null);
    }

    // --- GERAÇÃO DE PDF PROFISSIONAL ---

    private byte[] gerarPdf(List<ServidorEntity> lista, boolean publico) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ConfiguracaoDTO.Response config = configuracaoService.obterConfiguracao();
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1.5f, 8.5f});
            headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            if (config.urlBrasao() != null && !config.urlBrasao().isEmpty()) {
                try {
                    String subPasta = "config";
                    String nomeArquivo = config.urlBrasao().substring(config.urlBrasao().lastIndexOf("/") + 1);
                    Resource res = armazenamentoService.carregar(subPasta, nomeArquivo);
                    Image logo = Image.getInstance(res.getURL());
                    logo.scaleToFit(80, 80);
                    PdfPCell logoCell = new PdfPCell(logo);
                    logoCell.setBorder(Rectangle.NO_BORDER);
                    headerTable.addCell(logoCell);
                } catch (Exception e) { headerTable.addCell(""); }
            } else { headerTable.addCell(""); }

            PdfPCell infoCell = new PdfPCell();
            infoCell.setBorder(Rectangle.NO_BORDER);
            infoCell.addElement(new Paragraph(config.nomeEntidade().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            infoCell.addElement(new Paragraph("CNPJ: " + config.cnpj(), FontFactory.getFont(FontFactory.HELVETICA, 10)));
            infoCell.addElement(new Paragraph(config.endereco(), FontFactory.getFont(FontFactory.HELVETICA, 9)));
            headerTable.addCell(infoCell);

            document.add(headerTable);
            document.add(new Paragraph("__________________________________________________________________________________________________________________________________"));
            document.add(new Paragraph(" "));

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Paragraph title = new Paragraph(publico ? "PORTAL DA TRANSPARÊNCIA - RELAÇÃO DE SERVIDORES" : "RELATÓRIO ADMINISTRATIVO - SERVIDORES", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3, 1.5f, 2, 1.5f, 1.5f, 1});
            
            String[] headers = {"Nome", "CPF", "Cargo", "Lotação", "Vínculo", "Admissão"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                cell.setPadding(5);
                table.addCell(cell);
            }

            for (ServidorEntity s : lista) {
                table.addCell(new Phrase(s.getNome(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(publico ? mascararCpf(s.getCpf()) : s.getCpf(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(s.getCargo(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(s.getLotacao(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(s.getTipoVinculo(), FontFactory.getFont(FontFactory.HELVETICA, 8)));
                table.addCell(new Phrase(s.getDataAdmissao().format(DATE_FORMATTER), FontFactory.getFont(FontFactory.HELVETICA, 8)));
            }

            document.add(table);
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("Documento extraído do Portal da Transparência em: " + LocalDateTime.now().format(TIMESTAMP_FORMATTER), FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8));
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF institucional", e);
            return new byte[0];
        }
    }

    // --- MAPPERS E AUXILIARES ---

    private ServidorPublicoDTO mapToPublicoDTO(ServidorEntity s) {
        return ServidorPublicoDTO.builder().id(s.getId()).nome(s.getNome()).cpf(mascararCpf(s.getCpf()))
                .matricula(s.getMatricula()).cargo(s.getCargo()).lotacao(s.getLotacao())
                .tipoVinculo(s.getTipoVinculo()).dataAdmissao(s.getDataAdmissao()).build();
    }

    private ServidorAdminDTO mapToAdminDTO(ServidorEntity s) {
        return ServidorAdminDTO.builder().id(s.getId()).nome(s.getNome()).cpf(s.getCpf())
                .matricula(s.getMatricula()).cargo(s.getCargo()).lotacao(s.getLotacao())
                .tipoVinculo(s.getTipoVinculo()).dataAdmissao(s.getDataAdmissao())
                .idImportacao(s.getIdImportacao()).criadoPor(s.getCriadoPor()).criadoEm(s.getCriadoEm()).build();
    }

    private void dispararAuditoria(String acao, String id, Object ant, Object dnv) {
        try { eventPublisher.publishEvent(new LogAuditoriaEvent(acao, "SERVIDOR", id, ant, dnv)); }
        catch (Exception e) { log.error("Falha ao gravar log de auditoria: " + e.getMessage()); }
    }

    private Specification<ServidorEntity> construirFiltros(String n, String c, String l) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (n != null && !n.isBlank()) p.add(cb.like(cb.lower(root.get("nome")), "%"+n.toLowerCase()+"%"));
            if (c != null && !c.isBlank()) p.add(cb.like(cb.lower(root.get("cargo")), "%"+c.toLowerCase()+"%"));
            if (l != null && !l.isBlank()) p.add(cb.like(cb.lower(root.get("lotacao")), "%"+l.toLowerCase()+"%"));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    private String mascararCpf(String c) {
        if (c == null || c.length() < 11) return c;
        String n = c.replaceAll("\\D", "");
        return "***." + n.substring(3, 6) + "." + n.substring(6, 9) + "-**";
    }

    private String getUsuarioLogado() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "SISTEMA"; }
    }
}