package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioEntity, Long> {
    
    // Usado pelo Spring Security no Login
    UserDetails findByCpf(String cpf);
    
    // Usado pelos Services para buscas de entidades
    Optional<UsuarioEntity> findOptionalByCpf(String cpf);
    
    // Valida se já existe um usuário com o CPF informado
    boolean existsByCpf(String cpf);
    
    // Mantemos a validação de e-mail pois ele continua sendo UNIQUE no banco
    boolean existsByEmail(String email);
}