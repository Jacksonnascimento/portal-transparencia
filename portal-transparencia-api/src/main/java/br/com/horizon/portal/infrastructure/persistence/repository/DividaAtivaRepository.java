package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface DividaAtivaRepository extends JpaRepository<DividaAtivaEntity, Long>, JpaSpecificationExecutor<DividaAtivaEntity> {
}