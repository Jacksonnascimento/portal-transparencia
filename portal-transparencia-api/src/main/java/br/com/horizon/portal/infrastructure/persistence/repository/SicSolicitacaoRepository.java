package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SicSolicitacaoRepository extends JpaRepository<SicSolicitacaoEntity, Long> {

    boolean existsByProtocolo(String protocolo);

    Optional<SicSolicitacaoEntity> findByProtocoloAndDocumento(String protocolo, String documento);

    @Query("SELECT s FROM SicSolicitacaoEntity s LEFT JOIN FETCH s.tramites WHERE s.protocolo = :protocolo AND s.documento = :documento")
    Optional<SicSolicitacaoEntity> consultarComHistorico(@Param("protocolo") String protocolo, @Param("documento") String documento);

    /**
     * MÁGICA DOS FILTROS ATUALIZADA:
     * Agora inclui lógica para filtrar por prazos da LAI (20 e 30 dias).
     */
    @Query("SELECT s FROM SicSolicitacaoEntity s WHERE " +
            "(LOWER(s.protocolo) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(s.nome) LIKE LOWER(CONCAT('%', :busca, '%'))) AND " +
            "(:filtrarStatus = false OR s.status IN :statusList) AND " +
            "(s.dataSolicitacao >= :dataInicio) AND " +
            "(s.dataSolicitacao <= :dataFim) AND " +
            
            // FILTRO DE ALERTAS: Vencendo em até 3 dias (Calculado no Service e passado as datas de corte)
            "(:apenasAlertas = false OR (s.status NOT IN (br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.RESPONDIDO, br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.NEGADO) AND " +
            "((s.status != br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.PRORROGADO AND s.dataSolicitacao <= :alerta20Inicio AND s.dataSolicitacao > :vencido20) OR " +
            "(s.status = br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.PRORROGADO AND s.dataSolicitacao <= :alerta30Inicio AND s.dataSolicitacao > :vencido30)))) AND " +

            // FILTRO DE EXPIRADOS: Já passou do prazo legal
            "(:apenasExpirados = false OR (s.status NOT IN (br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.RESPONDIDO, br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.NEGADO) AND " +
            "((s.status != br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.PRORROGADO AND s.dataSolicitacao <= :vencido20) OR " +
            "(s.status = br.com.horizon.portal.infrastructure.persistence.enums.SicStatus.PRORROGADO AND s.dataSolicitacao <= :vencido30))))")
    Page<SicSolicitacaoEntity> buscarComFiltros(
            @Param("busca") String busca,
            @Param("filtrarStatus") boolean filtrarStatus,
            @Param("statusList") List<SicStatus> statusList,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            @Param("apenasAlertas") boolean apenasAlertas,
            @Param("apenasExpirados") boolean apenasExpirados,
            @Param("alerta20Inicio") LocalDateTime alerta20Inicio,
            @Param("vencido20") LocalDateTime vencido20,
            @Param("alerta30Inicio") LocalDateTime alerta30Inicio,
            @Param("vencido30") LocalDateTime vencido30,
            Pageable pageable);
}