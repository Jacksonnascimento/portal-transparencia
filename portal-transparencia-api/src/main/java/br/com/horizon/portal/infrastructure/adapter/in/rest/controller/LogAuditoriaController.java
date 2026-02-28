package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.persistence.entity.LogAuditoriaEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.LogAuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auditoria")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LogAuditoriaController {

    private final LogAuditoriaRepository repository;

    @GetMapping
    public ResponseEntity<Page<LogAuditoriaEntity>> listarAuditoria(
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) String usuarioNome, // Novo parâmetro
            Pageable pageable) {

        // Tratamento contra nulos para o Spring Data JPA funcionar como "Coringa"
        // (Wildcard)
        String filtroAcao = acao == null ? "" : acao;
        String filtroEntidade = entidade == null ? "" : entidade;
        String filtroUsuario = usuarioNome == null ? "" : usuarioNome;

        return ResponseEntity.ok(repository
                .findByAcaoContainingIgnoreCaseAndEntidadeContainingIgnoreCaseAndUsuarioNomeContainingIgnoreCase(
                        filtroAcao,
                        filtroEntidade,
                        filtroUsuario,
                        pageable));
    }
}