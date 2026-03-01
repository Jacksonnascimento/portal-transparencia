package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.ServicoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServicoRepository extends JpaRepository<ServicoEntity, UUID> {
    
    List<ServicoEntity> findAllByStatusOrderByNomeAsc(ServicoEntity.StatusServico status);

    // Nova query para o campo de pesquisa no Portal Público
    @Query("SELECT s FROM ServicoEntity s WHERE s.status = :status AND " +
           "(LOWER(s.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(s.descricao) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(s.setorResponsavel) LIKE LOWER(CONCAT('%', :busca, '%'))) " +
           "ORDER BY s.nome ASC")
    List<ServicoEntity> buscarServicosAtivos(@Param("status") ServicoEntity.StatusServico status, @Param("busca") String busca);
}