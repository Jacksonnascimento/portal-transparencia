package br.com.horizon.portal.application.dto.usuario;

import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import java.time.LocalDateTime;

public class UsuarioDTO {

    // O que a API DEVOLVE para o Front-end (NUNCA devolver a senha)
    public record Response(
            Long id,
            String nome,
            String email,
            String role,
            Boolean ativo,
            LocalDateTime dataCriacao
    ) {
        public static Response fromEntity(UsuarioEntity entity) {
            return new Response(entity.getId(), entity.getNome(), entity.getEmail(), 
                                entity.getRole(), entity.getAtivo(), entity.getDataCriacao());
        }
    }

    // O que a API RECEBE para CRIAR um usuário
    public record Create(String nome, String email, String senha, String role) {}

    // O que a API RECEBE para EDITAR um usuário (sem a senha)
    public record Update(String nome, String email, String role) {}

    // O que a API RECEBE para TROCAR A SENHA
    public record UpdateSenha(String novaSenha) {}
}