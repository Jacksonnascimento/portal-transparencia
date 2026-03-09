package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.EstruturaOrganizacionalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EstruturaOrganizacionalRepository extends JpaRepository<EstruturaOrganizacionalEntity, UUID> {
    
    List<EstruturaOrganizacionalEntity> findAllByOrderByNomeOrgaoAsc();

    // Query reescrita para evitar o erro "lower(bytea)". O coalesce garante que seja string.
    @Query("SELECT e FROM EstruturaOrganizacionalEntity e " +
           "WHERE (:nomeOrgao IS NULL OR LOWER(e.nomeOrgao) LIKE LOWER(CONCAT('%', CAST(:nomeOrgao AS string), '%'))) " +
           "AND (:sigla IS NULL OR LOWER(e.sigla) LIKE LOWER(CONCAT('%', CAST(:sigla AS string), '%'))) " +
           "AND (:nomeDirigente IS NULL OR LOWER(e.nomeDirigente) LIKE LOWER(CONCAT('%', CAST(:nomeDirigente AS string), '%'))) " +
           "AND (:cargoDirigente IS NULL OR LOWER(e.cargoDirigente) LIKE LOWER(CONCAT('%', CAST(:cargoDirigente AS string), '%'))) " +
           "ORDER BY e.nomeOrgao ASC")
    List<EstruturaOrganizacionalEntity> buscarComFiltros(
            @Param("nomeOrgao") String nomeOrgao,
            @Param("sigla") String sigla,
            @Param("nomeDirigente") String nomeDirigente,
            @Param("cargoDirigente") String cargoDirigente
    );
}