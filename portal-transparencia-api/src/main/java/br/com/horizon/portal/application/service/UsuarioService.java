package br.com.horizon.portal.application.service; 

import br.com.horizon.portal.application.dto.usuario.UsuarioDTO;
import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher; // Injeção do publicador de eventos

    public List<UsuarioDTO.Response> listarTodos() {
        return repository.findAll().stream()
                .map(UsuarioDTO.Response::fromEntity)
                .toList();
    }

    public UsuarioDTO.Response buscarPorId(Long id) {
        UsuarioEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        return UsuarioDTO.Response.fromEntity(entity);
    }

    @Transactional
    public UsuarioDTO.Response criar(UsuarioDTO.Create dto) {
        if (repository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-mail já está em uso por outro usuário.");
        }

        UsuarioEntity novoUsuario = UsuarioEntity.builder()
                .nome(dto.nome())
                .email(dto.email())
                .senha(passwordEncoder.encode(dto.senha()))
                .role(dto.role() != null ? dto.role().toUpperCase() : "USER")
                .ativo(true)
                .build();

        novoUsuario = repository.save(novoUsuario);
        UsuarioDTO.Response response = UsuarioDTO.Response.fromEntity(novoUsuario);

        // Dispara auditoria
        eventPublisher.publishEvent(new LogAuditoriaEvent("CRIACAO", "USUARIO", novoUsuario.getId().toString(), null, response));

        return response;
    }

    @Transactional
    public UsuarioDTO.Response atualizar(Long id, UsuarioDTO.Update dto) {
        UsuarioEntity usuario = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (!usuario.getEmail().equalsIgnoreCase(dto.email()) && repository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-mail já está em uso por outro usuário.");
        }

        // Estado Anterior
        UsuarioDTO.Response estadoAnterior = UsuarioDTO.Response.fromEntity(usuario);

        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setRole(dto.role().toUpperCase());

        UsuarioEntity savedUsuario = repository.save(usuario);
        UsuarioDTO.Response estadoNovo = UsuarioDTO.Response.fromEntity(savedUsuario);

        // Dispara auditoria
        eventPublisher.publishEvent(new LogAuditoriaEvent("ATUALIZACAO", "USUARIO", savedUsuario.getId().toString(), estadoAnterior, estadoNovo));

        return estadoNovo;
    }

    @Transactional
    public void alternarStatus(Long id) {
        UsuarioEntity usuario = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        
        UsuarioDTO.Response estadoAnterior = UsuarioDTO.Response.fromEntity(usuario);
        
        usuario.setAtivo(!usuario.getAtivo());
        UsuarioEntity savedUsuario = repository.save(usuario);
        UsuarioDTO.Response estadoNovo = UsuarioDTO.Response.fromEntity(savedUsuario);

        // Dispara auditoria
        eventPublisher.publishEvent(new LogAuditoriaEvent("ALTERACAO_STATUS", "USUARIO", savedUsuario.getId().toString(), estadoAnterior, estadoNovo));
    }

    @Transactional
    public void alterarSenha(Long id, String novaSenha) {
        UsuarioEntity usuario = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        repository.save(usuario);

        // Dispara auditoria ocultando as senhas para proteger a base de logs
        eventPublisher.publishEvent(new LogAuditoriaEvent("ALTERACAO_SENHA", "USUARIO", usuario.getId().toString(), "[OCULTO POR SEGURANÇA]", "[OCULTO POR SEGURANÇA]"));
    }
}