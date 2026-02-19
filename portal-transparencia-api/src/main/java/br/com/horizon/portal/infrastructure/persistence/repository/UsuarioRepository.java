package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;



public interface UsuarioRepository extends JpaRepository<UsuarioEntity, Long> {
    
    // Método que o Spring Security vai usar para procurar o utilizador pelo e-mail
    UserDetails findByEmail(String email);
}