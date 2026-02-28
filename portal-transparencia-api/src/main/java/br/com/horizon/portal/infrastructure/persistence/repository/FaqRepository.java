package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.FaqEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FaqRepository extends JpaRepository<FaqEntity, Long> {

    // Lista apenas os ativos ordenados (usado quando não há busca no Portal)
    Page<FaqEntity> findByAtivoTrueOrderByOrdemAsc(Pageable pageable);

    // Busca Pública: Apenas ativos, ignorando maiúsculas, minúsculas e ACENTOS
    @Query("SELECT f FROM FaqEntity f WHERE f.ativo = true AND (" +
           "CAST(function('unaccent', lower(f.pergunta)) AS String) LIKE CAST(function('unaccent', lower(concat('%', :busca, '%'))) AS String) OR " +
           "CAST(function('unaccent', lower(f.resposta)) AS String) LIKE CAST(function('unaccent', lower(concat('%', :busca, '%'))) AS String)" +
           ")")
    Page<FaqEntity> buscarAtivosPorPalavraChave(@Param("busca") String busca, Pageable pageable);

    // Busca Retaguarda (Admin): Todos os registros, ignorando maiúsculas, minúsculas e ACENTOS
    @Query("SELECT f FROM FaqEntity f WHERE " +
           "CAST(function('unaccent', lower(f.pergunta)) AS String) LIKE CAST(function('unaccent', lower(concat('%', :busca, '%'))) AS String) OR " +
           "CAST(function('unaccent', lower(f.resposta)) AS String) LIKE CAST(function('unaccent', lower(concat('%', :busca, '%'))) AS String)")
    Page<FaqEntity> buscarTodosAdminPorPalavraChave(@Param("busca") String busca, Pageable pageable);
}