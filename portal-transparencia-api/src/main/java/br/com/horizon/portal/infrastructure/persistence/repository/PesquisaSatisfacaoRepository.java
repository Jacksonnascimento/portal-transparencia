package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.PesquisaSatisfacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.ModuloAvaliado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PesquisaSatisfacaoRepository extends JpaRepository<PesquisaSatisfacaoEntity, Long> {

    // 1. Calcula a Nota Média por Módulo (Ex: e-SIC)
    @Query("SELECT AVG(p.nota) FROM PesquisaSatisfacaoEntity p WHERE p.moduloAvaliado = :modulo")
    Double findMediaPorModulo(@Param("modulo") ModuloAvaliado modulo);

    // 2. Conta o total de avaliações por Módulo
    Long countByModuloAvaliado(ModuloAvaliado modulo);

    // 3. Conta quantas notas foram "Positivas" (4 e 5) para o cálculo de % de aprovação
    @Query("SELECT COUNT(p) FROM PesquisaSatisfacaoEntity p WHERE p.moduloAvaliado = :modulo AND p.nota >= 4")
    Long countAvaliacoesPositivas(@Param("modulo") ModuloAvaliado modulo);
}