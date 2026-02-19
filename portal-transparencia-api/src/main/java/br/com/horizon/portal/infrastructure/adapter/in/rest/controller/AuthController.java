package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.infrastructure.adapter.in.rest.dto.LoginRequest;
import br.com.horizon.portal.infrastructure.adapter.in.rest.dto.TokenResponse;
import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import br.com.horizon.portal.infrastructure.security.TokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager manager;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> efetuarLogin(@RequestBody @Valid LoginRequest dados) {
        // Cria um token temporário só com e-mail e senha para o Spring Security tentar validar
        var authenticationToken = new UsernamePasswordAuthenticationToken(dados.email(), dados.senha());
        
        // O "manager" vai lá no AutenticacaoService (que criamos antes) bater o e-mail e a senha com o banco
        var authentication = manager.authenticate(authenticationToken);
        
        // Se a senha estiver correta, ele passa pra cá. Pegamos os dados do usuário logado:
        var usuario = (UsuarioEntity) authentication.getPrincipal();
        
        // Geramos o Token JWT (o "crachá" oficial)
        var tokenJWT = tokenService.gerarToken(usuario);

        // Devolvemos o token e alguns dados úteis para o Frontend (como o nome para mostrar no cabeçalho)
        return ResponseEntity.ok(new TokenResponse(tokenJWT, "Bearer", usuario.getNome(), usuario.getRole()));
    }
}