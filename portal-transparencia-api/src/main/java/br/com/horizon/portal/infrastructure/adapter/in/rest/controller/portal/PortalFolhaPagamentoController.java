package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.folhapagamento.FolhaEstatisticaDTO;
import br.com.horizon.portal.application.dto.folhapagamento.FolhaPagamentoPublicoDTO;
import br.com.horizon.portal.application.service.FolhaPagamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/folha-pagamento")
@RequiredArgsConstructor
public class PortalFolhaPagamentoController {

    private final FolhaPagamentoService folhaPagamentoService;

    @GetMapping
    public ResponseEntity<Page<FolhaPagamentoPublicoDTO>> listar(
            @RequestParam(required = false) String nomeServidor,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<FolhaPagamentoPublicoDTO> pagina = folhaPagamentoService.listarPublico(nomeServidor, exercicio, mes, pageable);
        return ResponseEntity.ok(pagina);
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<FolhaEstatisticaDTO> obterEstatisticas(
            @RequestParam Integer exercicio,
            @RequestParam Integer mes) {
        
        FolhaEstatisticaDTO estatisticas = folhaPagamentoService.obterEstatistica(exercicio, mes);
        return ResponseEntity.ok(estatisticas);
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) String nomeServidor,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes) {
        
        byte[] data = folhaPagamentoService.exportarPublicoCsv(nomeServidor, exercicio, mes);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=folha_pagamento_portal.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(required = false) String nomeServidor,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer mes) {
        
        byte[] data = folhaPagamentoService.exportarPublicoPdf(nomeServidor, exercicio, mes);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=folha_pagamento_portal.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}