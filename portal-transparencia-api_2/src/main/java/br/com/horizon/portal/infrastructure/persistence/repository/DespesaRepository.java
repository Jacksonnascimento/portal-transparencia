package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DespesaRepository extends JpaRepository<DespesaEntity, Long> {
    
    // Filtro básico por Órgão (Secretaria)
    Page<DespesaEntity> findByOrgaoNomeContainingIgnoreCase(String orgao, Pageable pageable);
    
    // Filtro por fornecedor (Join implícito)
    Page<DespesaEntity> findByCredorRazaoSocialContainingIgnoreCase(String nomeCredor, Pageable pageable);
}