package br.com.horizon.portal.infrastructure.adapter.in.rest.controller.admin;

import br.com.horizon.portal.application.dto.auth.LoginRequest;
import br.com.horizon.portal.application.dto.auth.TokenResponse;
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
        // Limpa a formatação do CPF (ex: 123.456.789-00 -> 12345678900)
        String cpfLimpo = dados.cpf().replaceAll("\\D", "");
        
        // Cria um token temporário com o CPF limpo e senha para o Spring Security validar
        var authenticationToken = new UsernamePasswordAuthenticationToken(cpfLimpo, dados.senha());
        
        // O "manager" vai lá no AutenticacaoService bater o CPF e a senha com o banco
        var authentication = manager.authenticate(authenticationToken);
        
        // Se a senha estiver correta, pegamos os dados do usuário logado:
        var usuario = (UsuarioEntity) authentication.getPrincipal();

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Geramos o Token JWT (o "crachá" oficial). Como configuramos o UsuarioEntity, o Subject será o CPF!
        var tokenJWT = tokenService.gerarToken(usuario);

        // Devolvemos o token e dados úteis para o Frontend
        return ResponseEntity.ok(new TokenResponse(tokenJWT, "Bearer", usuario.getNome(), usuario.getRole()));
    }
}