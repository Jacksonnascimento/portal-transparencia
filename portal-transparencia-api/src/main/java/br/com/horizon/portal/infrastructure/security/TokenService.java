package br.com.horizon.portal.infrastructure.security;

import br.com.horizon.portal.infrastructure.audit.LogAuditoriaEvent;
import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class TokenService {

    // Lê a chave secreta do application.properties (se não existir, usa uma padrão de dev)
    @Value("${api.security.token.secret:horizon-secret-key-123}")
    private String secret;

    @Autowired
    private ApplicationEventPublisher eventPublisher; // INJETADO PARA AUDITORIA

    public String gerarToken(UsuarioEntity usuario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            String token = JWT.create()
                    .withIssuer("portal-transparencia-api")
                    .withSubject(usuario.getEmail())
                    .withClaim("id", usuario.getId())
                    .withClaim("nome", usuario.getNome())
                    .withClaim("role", usuario.getRole())
                    .withExpiresAt(dataExpiracao())
                    .sign(algorithm);

            // --- GATILHO DE AUDITORIA ---
            eventPublisher.publishEvent(new LogAuditoriaEvent(
                    "LOGIN_REALIZADO",
                    "AUTENTICACAO",
                    usuario.getEmail(),
                    null,
                    "Acesso concedido com perfil: " + usuario.getRole()
            ));
            // -----------------------------

            return token;

        } catch (JWTCreationException exception){
            throw new RuntimeException("Erro ao gerar token jwt", exception);
        }
    }

    public String getSubject(String tokenJWT) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer("portal-transparencia-api")
                    .build()
                    .verify(tokenJWT)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return ""; // Se o token for inválido, retorna vazio e bloqueia o utilizador
        }
    }

    private Instant dataExpiracao() {
        // Token válido por 2 horas
        return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-03:00"));
    }
}