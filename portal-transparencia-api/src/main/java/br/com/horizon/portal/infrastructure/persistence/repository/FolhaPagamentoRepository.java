package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.FolhaPagamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FolhaPagamentoRepository extends JpaRepository<FolhaPagamentoEntity, Long>, JpaSpecificationExecutor<FolhaPagamentoEntity> {

    void deleteByIdImportacao(String idImportacao);
    
    List<FolhaPagamentoEntity> findAllByIdImportacao(String idImportacao);
    boolean existsByServidorIdAndExercicioAndMes(Long servidorId, Integer exercicio, Integer mes);

    // --- QUERIES PARA DASHBOARD E ESTATÍSTICAS ---

    @Query("SELECT SUM(f.remuneracaoBruta) FROM FolhaPagamentoEntity f WHERE f.exercicio = :exercicio AND f.mes = :mes")
    BigDecimal sumRemuneracaoBruta(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    @Query("SELECT SUM(f.verbasIndenizatorias) FROM FolhaPagamentoEntity f WHERE f.exercicio = :exercicio AND f.mes = :mes")
    BigDecimal sumVerbasIndenizatorias(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    @Query("SELECT SUM(f.descontosLegais) FROM FolhaPagamentoEntity f WHERE f.exercicio = :exercicio AND f.mes = :mes")
    BigDecimal sumDescontosLegais(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    @Query("SELECT SUM(f.salarioLiquido) FROM FolhaPagamentoEntity f WHERE f.exercicio = :exercicio AND f.mes = :mes")
    BigDecimal sumSalarioLiquido(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    @Query("SELECT COUNT(f) FROM FolhaPagamentoEntity f WHERE f.exercicio = :exercicio AND f.mes = :mes")
    Long countServidoresPagos(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    @Query("SELECT MAX(f.salarioLiquido) FROM FolhaPagamentoEntity f WHERE f.exercicio = :exercicio AND f.mes = :mes")
    BigDecimal findMaxSalarioLiquido(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    // Busca a distribuição de gastos por Tipo de Vínculo (Para Gráficos)
    @Query("SELECT f.servidor.tipoVinculo as nome, SUM(f.salarioLiquido) as valor " +
           "FROM FolhaPagamentoEntity f " +
           "WHERE f.exercicio = :exercicio AND f.mes = :mes " +
           "GROUP BY f.servidor.tipoVinculo")
    List<DistribuicaoGasto> findDistribuicaoPorVinculo(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    // Busca a distribuição de gastos por Lotação (Para Gráficos)
    @Query("SELECT f.servidor.lotacao as nome, SUM(f.salarioLiquido) as valor " +
           "FROM FolhaPagamentoEntity f " +
           "WHERE f.exercicio = :exercicio AND f.mes = :mes " +
           "GROUP BY f.servidor.lotacao")
    List<DistribuicaoGasto> findDistribuicaoPorLotacao(@Param("exercicio") Integer exercicio, @Param("mes") Integer mes);

    // Interface para mapear o resultado dos agrupamentos
    interface DistribuicaoGasto {
        String getNome();
        BigDecimal getValor();
    }
}