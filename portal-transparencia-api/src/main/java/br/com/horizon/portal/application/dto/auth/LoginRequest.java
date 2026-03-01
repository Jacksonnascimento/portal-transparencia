package br.com.horizon.portal.application.dto.auth;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.br.CPF;

public record LoginRequest(
        @NotBlank(message = "O CPF é obrigatório") 
        @CPF(message = "Formato de CPF inválido") 
        String cpf,
        
        @NotBlank(message = "A senha é obrigatória") 
        String senha
) {
}