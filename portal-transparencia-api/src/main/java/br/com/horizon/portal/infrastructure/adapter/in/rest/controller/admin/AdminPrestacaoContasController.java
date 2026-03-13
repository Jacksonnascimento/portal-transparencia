package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.prestacaocontas.PrestacaoContasRequestDTO;
import br.com.horizon.portal.application.dto.prestacaocontas.PrestacaoContasResponseDTO;
import br.com.horizon.portal.application.service.PrestacaoContasService;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prestacao-contas")
@RequiredArgsConstructor
public class AdminPrestacaoContasController {

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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrestacaoContasResponseDTO> salvar(
            @RequestPart("dados") @Valid PrestacaoContasRequestDTO dto,
            @RequestPart("file") MultipartFile file) {
        
        PrestacaoContasResponseDTO response = service.salvar(dto, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}