package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.estrutura.EstruturaOrganizacionalDTO;
import br.com.horizon.portal.application.service.EstruturaOrganizacionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/estrutura-organizacional")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // <-- ADICIONADO AQUI TAMBÉM
public class AdminEstruturaOrganizacionalController {

    private final EstruturaOrganizacionalService service;

    private String getUsuarioLogado() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<EstruturaOrganizacionalDTO>> listar(
            @RequestParam(required = false) String nomeOrgao,
            @RequestParam(required = false) String sigla,
            @RequestParam(required = false) String nomeDirigente,
            @RequestParam(required = false) String cargoDirigente) {
        
        return ResponseEntity.ok(service.listarComFiltros(nomeOrgao, sigla, nomeDirigente, cargoDirigente));
    }

    @PostMapping
    public ResponseEntity<EstruturaOrganizacionalDTO> criar(@RequestBody EstruturaOrganizacionalDTO dto) {
        EstruturaOrganizacionalDTO criada = service.criar(dto, getUsuarioLogado());
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstruturaOrganizacionalDTO> atualizar(@PathVariable UUID id, @RequestBody EstruturaOrganizacionalDTO dto) {
        EstruturaOrganizacionalDTO atualizada = service.atualizar(id, dto, getUsuarioLogado());
        return ResponseEntity.ok(atualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id, getUsuarioLogado());
        return ResponseEntity.noContent().build();
    }
}