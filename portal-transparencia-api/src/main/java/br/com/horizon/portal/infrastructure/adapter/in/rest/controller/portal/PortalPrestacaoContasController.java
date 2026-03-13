package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.portal;

import br.com.horizon.portal.application.dto.prestacaocontas.PrestacaoContasResponseDTO;
import br.com.horizon.portal.application.service.PrestacaoContasService;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/prestacao-contas")
@RequiredArgsConstructor
public class PortalPrestacaoContasController {

    private final PrestacaoContasService service;

    @GetMapping
    public ResponseEntity<Page<PrestacaoContasResponseDTO>> listar(
            @RequestParam(required = false) TipoRelatorio tipoRelatorio,
            @RequestParam(required = false) Integer exercicio,
            @RequestParam(required = false) Integer periodo,
            @RequestParam(required = false) TipoPeriodo tipoPeriodo,
            @RequestParam(required = false) String termoBusca,
            @PageableDefault(size = 20, sort = "dataPublicacao", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PrestacaoContasResponseDTO> result = service.listar(
                tipoRelatorio, exercicio, periodo, tipoPeriodo, termoBusca, pageable);
        return ResponseEntity.ok(result);
    }
}