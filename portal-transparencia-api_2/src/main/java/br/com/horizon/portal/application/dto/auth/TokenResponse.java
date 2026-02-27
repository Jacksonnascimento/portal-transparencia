package br.com.horizon.portal.application.dto.auth;

public record TokenResponse(
        String token,
        String tipo,
        String nome,
        String role
) {
}