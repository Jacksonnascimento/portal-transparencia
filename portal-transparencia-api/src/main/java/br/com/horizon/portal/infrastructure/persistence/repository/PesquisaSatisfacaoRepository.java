package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.PesquisaSatisfacaoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PesquisaSatisfacaoRepository extends JpaRepository<PesquisaSatisfacaoEntity, Long> {
}