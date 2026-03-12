package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DividaAtivaRepository extends JpaRepository<DividaAtivaEntity, Long>, JpaSpecificationExecutor<DividaAtivaEntity> {

    // Busca apenas os anos que possuem registro, sem repetir, do maior para o menor
    @Query("SELECT DISTINCT d.anoInscricao FROM DividaAtivaEntity d ORDER BY d.anoInscricao DESC")
    List<Integer> findAnosDisponiveis();
    
}