package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.horizon.portal.application.dto.sic.SicTramiteRequestDTO;
import br.com.horizon.portal.application.service.SicSolicitacaoService;
import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.SicSolicitacaoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/sic/solicitacoes") // Sem a palavra 'portal', exige Token JWT
@RequiredArgsConstructor
public class SicAdminController {

    private final SicSolicitacaoService service;
    private final SicSolicitacaoRepository repository;

    // Endpoint para listar os pedidos na tabela do nosso painel Admin
    @GetMapping
    public ResponseEntity<Page<SicSolicitacaoEntity>> listarSolicitacoes(
            @PageableDefault(size = 20, sort = "dataSolicitacao", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<SicSolicitacaoEntity> page = repository.findAll(pageable);
        return ResponseEntity.ok(page);
    }

    // Endpoint principal de trabalho: onde a prefeitura responde o pedido
    @PutMapping("/{id}/tramitar")
    public ResponseEntity<Void> tramitarSolicitacao(
            @PathVariable Long id,
            @RequestBody @Valid SicTramiteRequestDTO dto,
            @AuthenticationPrincipal UserDetails usuarioLogado) { // Pega o usuário do Token JWT para a Auditoria

        // Simulando a extração do ID do usuário (ajuste conforme a sua classe UsuarioEntity/UserDetails)
        Long usuarioId = 1L; // Placeholder: Idealmente, extrair o ID real do usuarioLogado

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