package br.com.horizon.portal.infrastructure.adapter.in.rest.dto;

public record TokenResponse(
        String token,
        String tipo,
        String nome,
        String role
) {
}