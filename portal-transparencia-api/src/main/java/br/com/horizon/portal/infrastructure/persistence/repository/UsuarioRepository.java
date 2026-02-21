package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioEntity, Long> {
    
    // Usado pelo Spring Security no Login
    UserDetails findByEmail(String email);
    
    // NOVO: Usado para validar se podemos criar um novo usuário com este e-mail
    boolean existsByEmail(String email);
}