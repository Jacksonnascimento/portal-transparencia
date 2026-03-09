package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.estrutura.EstruturaOrganizacionalDTO;
import br.com.horizon.portal.application.service.EstruturaOrganizacionalService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/api/v1/portal/estrutura-organizacional")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // <-- CORREÇÃO DO ERRO DE DOWNLOAD (CORS) AQUI
public class PortalEstruturaOrganizacionalController {

    private final EstruturaOrganizacionalService service;

    @GetMapping
    public ResponseEntity<List<EstruturaOrganizacionalDTO>> listar(
            @RequestParam(required = false) String nomeOrgao,
            @RequestParam(required = false) String sigla,
            @RequestParam(required = false) String nomeDirigente,
            @RequestParam(required = false) String cargoDirigente) {
        
        return ResponseEntity.ok(service.listarComFiltros(nomeOrgao, sigla, nomeDirigente, cargoDirigente));
    }

    @GetMapping("/exportar/csv")
    public void exportarCsv(
            @RequestParam(required = false) String nomeOrgao,
            @RequestParam(required = false) String sigla,
            @RequestParam(required = false) String nomeDirigente,
            @RequestParam(required = false) String cargoDirigente,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=estrutura-organizacional.csv");
        
        PrintWriter writer = response.getWriter();
        service.gerarCsvEstrutura(nomeOrgao, sigla, nomeDirigente, cargoDirigente, writer);
        writer.flush();
        writer.close();
    }

    @GetMapping("/exportar/pdf")
    public void exportarPdf(
            @RequestParam(required = false) String nomeOrgao,
            @RequestParam(required = false) String sigla,
            @RequestParam(required = false) String nomeDirigente,
            @RequestParam(required = false) String cargoDirigente,
            HttpServletResponse response) throws Exception {

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=estrutura-organizacional.pdf");
        
        service.gerarPdfEstrutura(nomeOrgao, sigla, nomeDirigente, cargoDirigente, response);
    }
}