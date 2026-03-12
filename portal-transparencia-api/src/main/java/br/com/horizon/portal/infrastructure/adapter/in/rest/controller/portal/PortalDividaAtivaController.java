package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.service.PortalDividaAtivaService;
import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.DividaAtivaRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/portal/receitas/divida-ativa") // Rota exata que combinamos!
@RequiredArgsConstructor
public class PortalDividaAtivaController {

    private final DividaAtivaRepository dividaAtivaRepository;
    private final PortalDividaAtivaService dividaAtivaService;

    public record DividaAtivaPublicaDTO(
            String nomeDevedor,
            String cpfCnpj,
            BigDecimal valorTotalDivida,
            Integer anoInscricao,
            String tipoDivida) {
        public static DividaAtivaPublicaDTO fromEntity(DividaAtivaEntity entity) {
            return new DividaAtivaPublicaDTO(
                    entity.getNomeDevedor(),
                    entity.getCpfCnpj(),
                    entity.getValorTotalDivida(),
                    entity.getAnoInscricao(),
                    entity.getTipoDivida());
        }
    }

    @GetMapping
    public ResponseEntity<Page<DividaAtivaPublicaDTO>> listarDividaAtivaPublica(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String tipoDivida, // NOVO PARÂMETRO
            @PageableDefault(size = 20, sort = { "anoInscricao", "nomeDevedor" }) Pageable pageable) {

        // Passando os 3 parâmetros
        Specification<DividaAtivaEntity> spec = dividaAtivaService.criarSpecificationDivida(nome, ano, tipoDivida);

        Page<DividaAtivaPublicaDTO> page = dividaAtivaRepository.findAll(spec, pageable)
                .map(DividaAtivaPublicaDTO::fromEntity);

        return ResponseEntity.ok(page);
    }

    @GetMapping("/exportar")
    public void exportarDividaAtiva(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String tipoDivida, // NOVO PARÂMETRO NA EXPORTAÇÃO
            @RequestParam(name = "formato", required = false, defaultValue = "csv") String formato,
            HttpServletResponse response) throws Exception {

        // Passando os 3 parâmetros para garantir que o Excel/PDF saia filtrado
        // corretamente!
        Specification<DividaAtivaEntity> spec = dividaAtivaService.criarSpecificationDivida(nome, ano, tipoDivida);

        if ("pdf".equalsIgnoreCase(formato)) {
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=\"divida_ativa_transparencia.pdf\"");
            dividaAtivaService.gerarPdfDivida(spec, response);
        } else {
            response.setContentType("text/csv");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Disposition", "attachment; filename=\"divida_ativa_transparencia.csv\"");
            dividaAtivaService.gerarCsvDivida(spec, response.getWriter());
        }
    }
}