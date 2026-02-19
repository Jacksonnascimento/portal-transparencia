package br.com.horizon.portal;

import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class PortalTransparenciaApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortalTransparenciaApiApplication.class, args);
    }

    // Este código vai rodar automaticamente assim que o Tomcat subir
    @Bean
    public CommandLineRunner arrumarSenhaAdmin(UsuarioRepository repository, PasswordEncoder encoder) {
        return args -> {
            var admin = (UsuarioEntity) repository.findByEmail("admin@horizon.com.br");
            if (admin != null) {
                // Aqui o Spring gera o Hash BCrypt real e salva no banco!
                admin.setSenha(encoder.encode("admin123"));
                repository.save(admin);
                System.out.println("✅ SENHA DO ADMIN CORRIGIDA E ENCRIPTADA COM SUCESSO!");
            }
        };
    }
}