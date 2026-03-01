package br.com.horizon.portal.application.dto.usuario;

import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.br.CPF;

import java.time.LocalDateTime;

public class UsuarioDTO {

    // O que a API DEVOLVE para o Front-end (NUNCA devolver a senha)
    public record Response(
            Long id,
            String nome,
            String cpf,
            String email,
            String role,
            Boolean ativo,
            LocalDateTime dataCriacao
    ) {
        public static Response fromEntity(UsuarioEntity entity) {
            return new Response(
                    entity.getId(), 
                    entity.getNome(), 
                    entity.getCpf(), 
                    entity.getEmail(), 
                    entity.getRole(), 
                    entity.getAtivo(), 
                    entity.getDataCriacao()
            );
        }
    }

    // O que a API RECEBE para CRIAR um usuário
    public record Create(
            @NotBlank(message = "O nome é obrigatório") 
            String nome, 
            
            @NotBlank(message = "O CPF é obrigatório") 
            @CPF(message = "Formato de CPF inválido") 
            String cpf, 
            
            @Email(message = "Formato de e-mail inválido") 
            String email, 
            
            @NotBlank(message = "A senha é obrigatória") 
            String senha, 
            
            String role
    ) {}

    // O que a API RECEBE para EDITAR um usuário (sem a senha)
    public record Update(
            @NotBlank(message = "O nome é obrigatório") 
            String nome, 
            
            @NotBlank(message = "O CPF é obrigatório") 
            @CPF(message = "Formato de CPF inválido") 
            String cpf, 
            
            @Email(message = "Formato de e-mail inválido") 
            String email, 
            
            String role
    ) {}

    // O que a API RECEBE para TROCAR A SENHA
    public record UpdateSenha(
            @NotBlank(message = "A nova senha é obrigatória") 
            String novaSenha
    ) {}
}