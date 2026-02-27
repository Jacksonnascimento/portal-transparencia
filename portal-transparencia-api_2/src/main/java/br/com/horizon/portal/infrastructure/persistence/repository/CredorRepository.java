package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.CredorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CredorRepository extends JpaRepository<CredorEntity, Long> {
    // Busca inteligente para evitar duplicidade na hora de importar
    Optional<CredorEntity> findByCpfCnpj(String cpfCnpj);
}