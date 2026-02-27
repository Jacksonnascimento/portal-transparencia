package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.LogAuditoriaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoriaEntity, Long> {
    
    
    List<LogAuditoriaEntity> findByEntidadeAndEntidadeIdOrderByDataHoraDesc(String entidade, String entidadeId);
}