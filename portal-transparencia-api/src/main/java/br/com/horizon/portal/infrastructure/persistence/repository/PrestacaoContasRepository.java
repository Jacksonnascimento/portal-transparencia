package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.PrestacaoContasEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoPeriodo;
import br.com.horizon.portal.infrastructure.persistence.enums.TipoRelatorio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PrestacaoContasRepository extends JpaRepository<PrestacaoContasEntity, UUID> {

    @Query("SELECT p FROM PrestacaoContasEntity p WHERE " +
           "(:tipoRelatorio IS NULL OR p.tipoRelatorio = :tipoRelatorio) AND " +
           "(:exercicio IS NULL OR p.exercicio = :exercicio) AND " +
           "(:periodo IS NULL OR p.periodo = :periodo) AND " +
           "(:tipoPeriodo IS NULL OR p.tipoPeriodo = :tipoPeriodo) AND " +
           "(CAST(:termoBusca AS string) IS NULL OR LOWER(p.arquivoNome) LIKE LOWER(CONCAT('%', CAST(:termoBusca AS string), '%')))")
    Page<PrestacaoContasEntity> findComFiltros(
            @Param("tipoRelatorio") TipoRelatorio tipoRelatorio,
            @Param("exercicio") Integer exercicio,
            @Param("periodo") Integer periodo,
            @Param("tipoPeriodo") TipoPeriodo tipoPeriodo,
            @Param("termoBusca") String termoBusca,
            Pageable pageable);
}