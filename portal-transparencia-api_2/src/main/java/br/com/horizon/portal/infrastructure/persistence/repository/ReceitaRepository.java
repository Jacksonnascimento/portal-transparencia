package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ReceitaRepository extends JpaRepository<ReceitaEntity, Long>, JpaSpecificationExecutor<ReceitaEntity> {

    long countByExercicio(Integer exercicio);

    Page<ReceitaEntity> findByExercicio(Integer exercicio, Pageable pageable);

    Page<ReceitaEntity> findByExercicioAndMes(Integer exercicio, Integer mes, Pageable pageable);

    Page<ReceitaEntity> findByOrigemContainingIgnoreCase(String termo, Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.valorArrecadado), 0) FROM ReceitaEntity r WHERE r.exercicio = :exercicio")
    BigDecimal totalArrecadadoPorAno(@Param("exercicio") Integer exercicio);

    @Query("SELECT DISTINCT r.exercicio FROM ReceitaEntity r ORDER BY r.exercicio DESC")
    List<Integer> findDistinctExercicios();

    // --- MÉTODOS PARA O DESFAZER (ROLLBACK) ---
    
    long countByIdImportacao(String idImportacao);

    @Modifying
    @Transactional
    @Query("DELETE FROM ReceitaEntity r WHERE r.idImportacao = :idImportacao")
    void deleteByIdImportacao(@Param("idImportacao") String idImportacao);

    List<ReceitaEntity> findByIdImportacao(String idImportacao);
}