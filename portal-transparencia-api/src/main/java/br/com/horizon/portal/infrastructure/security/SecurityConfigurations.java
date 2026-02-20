package br.com.horizon.portal.infrastructure.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(req -> {
                    // ROTAS PÚBLICAS (Abertas para a internet sem token)
                    req.requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll();
                    
                    // PORTAL DO CIDADÃO: Libera APENAS requisições de leitura (GET)
                    // Qualquer tentativa de POST, PUT ou DELETE baterá na parede e exigirá token.
                    req.requestMatchers(HttpMethod.GET, "/api/v1/receitas/**").permitAll(); 
                    req.requestMatchers(HttpMethod.GET, "/api/v1/portal/**").permitAll(); 
                    
                    // ROTAS PRIVADAS E DE ADMINISTRAÇÃO (Bloqueadas por padrão)
                    // Inclui POST/PUT/DELETE de receitas, e qualquer acesso a /auditoria e /usuarios
                    req.anyRequest().authenticated();
                })
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // CUIDADO COM O CORS: Lista de endereços permitidos para conversar com a API
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000", // A sua Retaguarda
            "http://localhost:3001", // O Portal do seu sócio (Next.js)
            "http://localhost:5173"  // O Portal do seu sócio (React/Vite)
        ));
        
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}