package br.com.horizon.portal.application.service; 

import br.com.horizon.portal.application.dto.usuario.UsuarioDTO;
import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

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
        return UsuarioDTO.Response.fromEntity(novoUsuario);
    }

    @Transactional
    public UsuarioDTO.Response atualizar(Long id, UsuarioDTO.Update dto) {
        UsuarioEntity usuario = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (!usuario.getEmail().equalsIgnoreCase(dto.email()) && repository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-mail já está em uso por outro usuário.");
        }

        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setRole(dto.role().toUpperCase());

        return UsuarioDTO.Response.fromEntity(repository.save(usuario));
    }

    @Transactional
    public void alternarStatus(Long id) {
        UsuarioEntity usuario = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        
        usuario.setAtivo(!usuario.getAtivo());
        repository.save(usuario);
    }

    @Transactional
    public void alterarSenha(Long id, String novaSenha) {
        UsuarioEntity usuario = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        repository.save(usuario);
    }
}