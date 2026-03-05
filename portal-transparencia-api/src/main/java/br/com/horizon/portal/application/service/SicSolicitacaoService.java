package br.com.horizon.portal.application.service;

import br.com.horizon.portal.application.dto.sic.SicEstatisticasDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoRequestDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoResponseDTO;
import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.SicTramiteEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import br.com.horizon.portal.infrastructure.persistence.repository.SicSolicitacaoRepository;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.time.format.DateTimeFormatter;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Year;
import java.awt.Color;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Slf4j
@Service
@RequiredArgsConstructor
public class SicSolicitacaoService {

    private final SicSolicitacaoRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final ConfiguracaoRepository configuracaoRepository;

    @Transactional
    public SicSolicitacaoResponseDTO criarSolicitacao(SicSolicitacaoRequestDTO dto) {
        String protocoloGerado = gerarProtocoloUnico();
        SicSolicitacaoEntity novaSolicitacao = SicSolicitacaoEntity.builder()
                .protocolo(protocoloGerado)
                .nome(dto.getNome())
                .documento(dto.getDocumento().replaceAll("\\D", ""))
                .email(dto.getEmail())
                .tipoSolicitacao(dto.getTipoSolicitacao())
                .mensagem(dto.getMensagem())
                .urlAnexoSolicitacao(dto.getUrlAnexoSolicitacao())
                .sigilo(dto.getSigilo())
                .status(SicStatus.RECEBIDO)
                .build();

        SicTramiteEntity tramiteInicial = SicTramiteEntity.builder()
                .status(SicStatus.RECEBIDO)
                .descricao("Solicitação aberta com sucesso pelo cidadão via Portal.")
                .dataTramite(LocalDateTime.now())
                .solicitacao(novaSolicitacao) 
                .build();

        novaSolicitacao.getTramites().add(tramiteInicial);
        novaSolicitacao = repository.save(novaSolicitacao);

        emailService.enviarEmailSic(novaSolicitacao.getEmail(), "Confirmação de Abertura", "Protocolo: " + protocoloGerado);
        return mapearParaResponse(novaSolicitacao);
    }

    @Transactional(readOnly = true)
    public SicSolicitacaoResponseDTO consultarProtocolo(String protocolo, String documento) {
        return repository.consultarComHistorico(protocolo, documento.replaceAll("\\D", ""))
                .map(this::mapearParaResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Protocolo não encontrado."));
    }

    @Transactional
    public void tramitarSolicitacao(Long id, SicStatus novoStatus, String resposta, String urlAnexo, Long usuarioId) {
        SicSolicitacaoEntity solicitacao = repository.findById(id).orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));
        String estadoAnterior = converterParaJson(solicitacao);
        
        solicitacao.setStatus(novoStatus);
        solicitacao.setUsuarioRespostaId(usuarioId);
        if (resposta != null && !resposta.isBlank()) {
            solicitacao.setRespostaOficial(resposta);
            solicitacao.setDataResposta(LocalDateTime.now());
            solicitacao.setUrlAnexoResposta(urlAnexo);
        }

        solicitacao.getTramites().add(SicTramiteEntity.builder()
                .status(novoStatus)
                .descricao(resposta != null && !resposta.isBlank() ? resposta : "Alteração de status para: " + novoStatus)
                .dataTramite(LocalDateTime.now())
                .usuarioId(usuarioId)
                .solicitacao(solicitacao).build());

        repository.save(solicitacao);
        eventPublisher.publishEvent(new LogAuditoriaEvent("ATUALIZACAO", "tb_sic_solicitacao", String.valueOf(id), estadoAnterior, converterParaJson(solicitacao)));

        if (novoStatus == SicStatus.RESPONDIDO || novoStatus == SicStatus.NEGADO) {
            emailService.enviarEmailSic(solicitacao.getEmail(), "Atualização e-SIC", "Seu protocolo " + solicitacao.getProtocolo() + " foi respondido.");
        }
    }

    @Transactional
    public void entrarComRecurso(String protocolo, String documento, String justificativa) {
        SicSolicitacaoEntity entity = repository.findByProtocoloAndDocumento(protocolo, documento.replaceAll("\\D", ""))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Não encontrado."));
        entity.setStatus(SicStatus.RECURSO_SOLICITADO);
        entity.getTramites().add(SicTramiteEntity.builder().status(SicStatus.RECURSO_SOLICITADO).descricao("Recurso: " + justificativa).dataTramite(LocalDateTime.now()).solicitacao(entity).build());
        repository.save(entity);
    }

    // DEVOLVIDO: Método de Estatísticas
    public SicEstatisticasDTO obterEstatisticas() {
        List<SicSolicitacaoEntity> todos = repository.findAll();
        long respondidos = todos.stream().filter(s -> s.getStatus() == SicStatus.RESPONDIDO).count();
        long emAberto = todos.stream().filter(s -> s.getStatus() == SicStatus.RECEBIDO || s.getStatus() == SicStatus.EM_ANALISE).count();
        long negados = todos.stream().filter(s -> s.getStatus() == SicStatus.NEGADO).count();
        double tempoMedio = todos.stream().filter(s -> s.getDataResposta() != null).mapToLong(s -> Duration.between(s.getDataSolicitacao(), s.getDataResposta()).toDays()).average().orElse(0.0);
        return SicEstatisticasDTO.builder().totalPedidos(todos.size()).pedidosRespondidos(respondidos).pedidosEmAberto(emAberto).pedidosNegados(negados).tempoMedioRespostaDias(tempoMedio).build();
    }

    @Transactional(readOnly = true)
    public Page<SicSolicitacaoResponseDTO> listarParaAdmin(String busca, String statusFiltro, LocalDate dataInicio, LocalDate dataFim, Pageable pageable) {
        String buscaSegura = (busca != null) ? busca : "";
        LocalDateTime inicio = (dataInicio != null) ? dataInicio.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime fim = (dataFim != null) ? dataFim.atTime(LocalTime.MAX) : LocalDateTime.of(2100, 12, 31, 23, 59);
        boolean filtrarStatus = !("TODOS".equalsIgnoreCase(statusFiltro));
        List<SicStatus> statusList = "PENDENTES".equalsIgnoreCase(statusFiltro) 
            ? Arrays.asList(SicStatus.RECEBIDO, SicStatus.EM_ANALISE, SicStatus.PRORROGADO, SicStatus.RECURSO_SOLICITADO)
            : (filtrarStatus ? List.of(SicStatus.valueOf(statusFiltro.toUpperCase())) : List.of(SicStatus.RECEBIDO));
        return repository.buscarComFiltros(buscaSegura, filtrarStatus, statusList, inicio, fim, pageable).map(this::mapearParaResponse);
    }

    @Transactional(readOnly = true)
    public byte[] exportarCsvAdmin(String busca, String statusFiltro, LocalDate dataInicio, LocalDate dataFim) {
        Page<SicSolicitacaoResponseDTO> dados = listarParaAdmin(busca, statusFiltro, dataInicio, dataFim, PageRequest.of(0, 10000));
        StringBuilder csv = new StringBuilder("Protocolo;Cidadão;Documento;Status;Data\n");
        for (SicSolicitacaoResponseDTO r : dados.getContent()) {
            csv.append(r.getProtocolo()).append(";").append(r.getNome()).append(";").append(r.getDocumento()).append(";").append(r.getStatus()).append(";").append(r.getDataSolicitacao()).append("\n");
        }
        return csv.toString().getBytes();
    }

    @Transactional(readOnly = true)
    public byte[] exportarPdfAdmin(String busca, String statusFiltro, LocalDate dataInicio, LocalDate dataFim) {
        Page<SicSolicitacaoResponseDTO> dados = listarParaAdmin(busca, statusFiltro, dataInicio, dataFim, PageRequest.of(0, 10000));
        ConfiguracaoEntity config = configuracaoRepository.findById(1L).orElseThrow(() -> new RuntimeException("Configurações não encontradas."));
        
        Document document = new Document(PageSize.A4.rotate()); 
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            String caminhoFisicoBrasao = "Imagens\\brasao.png";
            File file = new File(caminhoFisicoBrasao);

            if (file.exists()) {
                try {
                    Image brasao = Image.getInstance(file.getAbsolutePath());
                    brasao.scaleToFit(80, 80);
                    brasao.setAlignment(Element.ALIGN_CENTER);
                    document.add(brasao);
                } catch (Exception e) {
                    log.error("Erro ao carregar imagem: {}", e.getMessage());
                }
            } else {
                log.warn("Brasão não encontrado em: {}", file.getAbsolutePath());
            }

            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.BLACK);
            Font fontSub = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            
            Paragraph pTitulo = new Paragraph(config.getNomeEntidade() != null ? config.getNomeEntidade().toUpperCase() : "ENTIDADE", fontTitulo);
            pTitulo.setAlignment(Element.ALIGN_CENTER);
            document.add(pTitulo);

            Paragraph pSub = new Paragraph("RELATÓRIO DE SOLICITAÇÕES - e-SIC\n" + (config.getEndereco() != null ? config.getEndereco() : ""), fontSub);
            pSub.setAlignment(Element.ALIGN_CENTER);
            pSub.setSpacingAfter(20f);
            document.add(pSub);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 4f, 2.5f, 2f, 2.5f, 2.5f});

            Font fCab = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            String[] headers = {"Protocolo", "Cidadão", "Documento", "Status", "Abertura", "Resposta"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fCab));
                cell.setBackgroundColor(new Color(31, 41, 55));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6f);
                table.addCell(cell);
            }

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (SicSolicitacaoResponseDTO d : dados.getContent()) {
                table.addCell(new Phrase(d.getProtocolo(), fontSub));
                table.addCell(new Phrase(d.getNome(), fontSub));
                table.addCell(new Phrase(d.getDocumento(), fontSub));
                table.addCell(new Phrase(d.getStatus().toString(), fontSub));
                table.addCell(new Phrase(d.getDataSolicitacao().format(fmt), fontSub));
                table.addCell(new Phrase(d.getDataResposta() != null ? d.getDataResposta().format(fmt) : "Pendente", fontSub));
            }

            document.add(table);
            document.close();

        } catch (Exception e) {
            log.error("Erro ao gerar PDF", e);
        }

        return out.toByteArray();
    }

    private String gerarProtocoloUnico() {
        return "SIC-" + Year.now().getValue() + "-" + (100000 + new Random().nextInt(900000));
    }

    private String converterParaJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); } catch (Exception e) { return "{}"; }
    }

    private SicSolicitacaoResponseDTO mapearParaResponse(SicSolicitacaoEntity entity) {
        return SicSolicitacaoResponseDTO.fromEntity(entity);
    }
}