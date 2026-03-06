package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.diarias.DiariaPassagemDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.DiariaPassagemEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DiariaPassagemRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiariaPassagemService {

    private final DiariaPassagemRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private static final String MODULO_AUDITORIA = "DIARIAS_PASSAGENS";

    @Transactional
    public DiariaPassagemDTO.Response criar(DiariaPassagemDTO.Request dto) {
        if (dto.numeroProcesso() != null && !dto.numeroProcesso().isBlank()) {
            boolean jaExiste = repository.existsByNumeroProcessoAndNomeFavorecidoAndAtivoTrue(
                    dto.numeroProcesso(), dto.nomeFavorecido());
            if (jaExiste) {
                throw new RuntimeException("Já existe uma diária ativa registrada para este favorecido neste mesmo processo.");
            }
        }

        DiariaPassagemEntity entity = mapearParaEntidade(dto, new DiariaPassagemEntity());
        DiariaPassagemEntity saved = repository.save(entity);
        
        DiariaPassagemDTO.Response estadoNovo = DiariaPassagemDTO.Response.fromEntity(saved);

        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "CRIACAO", MODULO_AUDITORIA, saved.getId().toString(), null, estadoNovo));

        return estadoNovo;
    }

    @Transactional
    public DiariaPassagemDTO.Response atualizar(Long id, DiariaPassagemDTO.Request dto) {
        DiariaPassagemEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de diária não encontrado."));

        if (!entity.getAtivo()) {
            throw new RuntimeException("Não é possível alterar um registro inativo.");
        }

        DiariaPassagemDTO.Response estadoAnterior = DiariaPassagemDTO.Response.fromEntity(entity);

        mapearParaEntidade(dto, entity);
        DiariaPassagemEntity saved = repository.save(entity);
        
        DiariaPassagemDTO.Response estadoNovo = DiariaPassagemDTO.Response.fromEntity(saved);

        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "ATUALIZACAO", MODULO_AUDITORIA, saved.getId().toString(), estadoAnterior, estadoNovo));

        return estadoNovo;
    }

    @Transactional
    public void excluir(Long id) {
        DiariaPassagemEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de diária não encontrado."));

        DiariaPassagemDTO.Response estadoAnterior = DiariaPassagemDTO.Response.fromEntity(entity);

        entity.inativar();
        repository.save(entity);

        DiariaPassagemDTO.Response estadoNovo = DiariaPassagemDTO.Response.fromEntity(entity);

        eventPublisher.publishEvent(new LogAuditoriaEvent(
                "EXCLUSAO", MODULO_AUDITORIA, id.toString(), estadoAnterior, estadoNovo));
    }

    public DiariaPassagemDTO.Response buscarPorId(Long id) {
        return repository.findById(id)
                .map(DiariaPassagemDTO.Response::fromEntity)
                .orElseThrow(() -> new RuntimeException("Registro de diária não encontrado."));
    }

    public Page<DiariaPassagemDTO.Response> listarPaginado(Specification<DiariaPassagemEntity> spec, Pageable pageable) {
        return repository.findAll(spec, pageable).map(DiariaPassagemDTO.Response::fromEntity);
    }

    public List<Integer> obterAnosDisponiveis() {
        return repository.findDistinctExercicio();
    }

    // --- MÉTODOS DE EXPORTAÇÃO ---

    public byte[] exportarCsv(Specification<DiariaPassagemEntity> spec, boolean mascarar) {
        List<DiariaPassagemEntity> lista = repository.findAll(spec);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8), ';', 
                CSVWriter.NO_QUOTE_CHARACTER, CSVWriter.DEFAULT_ESCAPE_CHARACTER, CSVWriter.DEFAULT_LINE_END)) {
            
            writer.writeNext(new String[]{"Exercicio", "Favorecido", "CPF/CNPJ", "Destino", "Saida", "Retorno", "Processo", "Valor Total"});

            for (DiariaPassagemEntity d : lista) {
                writer.writeNext(new String[]{
                    d.getExercicio().toString(),
                    d.getNomeFavorecido(),
                    mascarar ? mascararDocumento(d.getCpfCnpjFavorecido()) : d.getCpfCnpjFavorecido(),
                    d.getDestinoViagem(),
                    d.getDataSaida().toString(),
                    d.getDataRetorno().toString(),
                    d.getNumeroProcesso(),
                    d.getValorTotal().toString()
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar CSV de diárias", e);
        }
        return out.toByteArray();
    }

    public byte[] exportarPdf(Specification<DiariaPassagemEntity> spec, boolean mascarar) {
        List<DiariaPassagemEntity> lista = repository.findAll(spec);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate()); // Horizontal

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Paragraph title = new Paragraph("Relatório de Diárias e Passagens", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 4f, 3f, 4f, 4f, 2.5f, 3f});

            String[] headers = {"Exerc.", "Favorecido", "CPF/CNPJ", "Destino", "Período", "Processo", "Total"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setBackgroundColor(new Color(240, 240, 240));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            for (DiariaPassagemEntity d : lista) {
                table.addCell(createPdfCell(d.getExercicio().toString()));
                table.addCell(createPdfCell(d.getNomeFavorecido()));
                table.addCell(createPdfCell(mascarar ? mascararDocumento(d.getCpfCnpjFavorecido()) : d.getCpfCnpjFavorecido()));
                table.addCell(createPdfCell(d.getDestinoViagem()));
                table.addCell(createPdfCell(d.getDataSaida() + " a " + d.getDataRetorno()));
                table.addCell(createPdfCell(d.getNumeroProcesso()));
                table.addCell(createPdfCell("R$ " + d.getValorTotal().toString()));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF de diárias", e);
        }
        return out.toByteArray();
    }

    private PdfPCell createPdfCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", FontFactory.getFont(FontFactory.HELVETICA, 9)));
        cell.setPadding(5);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private String mascararDocumento(String doc) {
        if (doc == null || doc.isEmpty()) return "---";
        String clean = doc.replaceAll("\\D", "");
        if (clean.length() == 11) return clean.substring(0, 3) + ".***.***-" + clean.substring(9);
        if (clean.length() == 14) return clean.substring(0, 2) + ".***.***/****-" + clean.substring(12);
        return doc;
    }

    private DiariaPassagemEntity mapearParaEntidade(DiariaPassagemDTO.Request dto, DiariaPassagemEntity entity) {
        entity.setExercicio(dto.exercicio());
        entity.setOrgaoId(dto.orgaoId());
        entity.setNomeFavorecido(dto.nomeFavorecido());
        entity.setCargoFavorecido(dto.cargoFavorecido());
        entity.setCpfCnpjFavorecido(dto.cpfCnpjFavorecido());
        entity.setDestinoViagem(dto.destinoViagem());
        entity.setMotivoViagem(dto.motivoViagem());
        entity.setDataSaida(dto.dataSaida());
        entity.setDataRetorno(dto.dataRetorno());
        entity.setQuantidadeDiarias(dto.quantidadeDiarias());
        entity.setValorDiarias(dto.valorDiarias());
        entity.setValorPassagens(dto.valorPassagens());
        entity.setValorDevolvido(dto.valorDevolvido());
        entity.setNumeroProcesso(dto.numeroProcesso());
        entity.setPortariaConcessao(dto.portariaConcessao());
        return entity;
    }
}