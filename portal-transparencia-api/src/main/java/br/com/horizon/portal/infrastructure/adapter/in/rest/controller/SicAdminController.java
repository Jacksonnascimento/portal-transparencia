package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.dto.sic.SicEstatisticasDTO;
import br.com.horizon.portal.application.dto.sic.SicSolicitacaoResponseDTO;
import br.com.horizon.portal.application.dto.sic.SicTramiteRequestDTO;
import br.com.horizon.portal.application.service.SicSolicitacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sic/solicitacoes") // Exige Token JWT
@RequiredArgsConstructor
public class SicAdminController {

    private final SicSolicitacaoService service;

    /**
     * NOVO: Endpoint para alimentar o Dashboard do Retaguarda
     * Inclui Nota Média e Percentual de Aprovação (Métricas PNTP)
     */
    @GetMapping("/estatisticas")
    public ResponseEntity<SicEstatisticasDTO> obterEstatisticas() {
        return ResponseEntity.ok(service.obterEstatisticas());
    }

    @GetMapping
    public ResponseEntity<Page<SicSolicitacaoResponseDTO>> listarSolicitacoes(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false, defaultValue = "PENDENTES") String statusFiltro,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @PageableDefault(size = 20, sort = "dataSolicitacao", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<SicSolicitacaoResponseDTO> page = service.listarParaAdmin(busca, statusFiltro, dataInicio, dataFim, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportarRelatorio(
            @RequestParam String tipo,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false, defaultValue = "TODOS") String statusFiltro,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        byte[] arquivo;
        String contentType;
        String extensao = tipo.toLowerCase();

        if ("pdf".equals(extensao)) {
            arquivo = service.exportarPdfAdmin(busca, statusFiltro, dataInicio, dataFim);
            contentType = "application/pdf";
        } else {
            arquivo = service.exportarCsvAdmin(busca, statusFiltro, dataInicio, dataFim);
            contentType = "text/csv";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"relatorio_esic." + extensao + "\"")
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(arquivo);
    }

    @PutMapping("/{id}/tramitar")
    public ResponseEntity<Void> tramitarSolicitacao(
            @PathVariable Long id,
            @RequestBody @Valid SicTramiteRequestDTO dto,
            @AuthenticationPrincipal UserDetails usuarioLogado) {

        // Em produção, aqui extraímos o ID real do usuarioLogado
        Long usuarioId = 1L; 

        service.tramitarSolicitacao(
                id, 
                dto.getStatus(), 
                dto.getResposta(), 
                dto.getUrlAnexo(), 
                usuarioId
        );

        return ResponseEntity.noContent().build();
    }
}