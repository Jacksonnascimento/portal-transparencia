package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.DespesaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DespesaRepository extends JpaRepository<DespesaEntity, Long>, JpaSpecificationExecutor<DespesaEntity> {

    // --- 1. FILTRO INTELIGENTE DE ANOS ---
    @Query("SELECT DISTINCT d.exercicio FROM DespesaEntity d ORDER BY d.exercicio DESC")
    List<Integer> findAnosDisponiveis();

    // --- 2. QUERIES PARA OS CARDS DE RESUMO (Selo Ouro) ---
    // Usamos COALESCE para garantir que, se não houver dados no ano, retorne 0 ao
    // invés de null
    @Query("SELECT SUM(d.valorEmpenhado) FROM DespesaEntity d WHERE (:ano IS NULL OR d.exercicio = :ano)")
    BigDecimal sumTotalEmpenhadoPorAno(@Param("ano") Integer ano);

    @Query("SELECT SUM(d.valorLiquidado) FROM DespesaEntity d WHERE (:ano IS NULL OR d.exercicio = :ano)")
    BigDecimal sumTotalLiquidadoPorAno(@Param("ano") Integer ano);

    @Query("SELECT SUM(d.valorPago) FROM DespesaEntity d WHERE (:ano IS NULL OR d.exercicio = :ano)")
    BigDecimal sumTotalPagoPorAno(@Param("ano") Integer ano);

    List<DespesaEntity> findByIdImportacao(String idImportacao);

}