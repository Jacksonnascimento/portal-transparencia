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

    // MÁGICA DOS FILTROS AQUI: Busca dinâmica com paginação
    @Query("SELECT s FROM SicSolicitacaoEntity s WHERE " +
           "(LOWER(s.protocolo) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(s.nome) LIKE LOWER(CONCAT('%', :busca, '%'))) AND " +
           "(:filtrarStatus = false OR s.status IN :statusList) AND " +
           "(s.dataSolicitacao >= :dataInicio) AND " +
           "(s.dataSolicitacao <= :dataFim)")
    Page<SicSolicitacaoEntity> buscarComFiltros(
            @Param("busca") String busca,
            @Param("filtrarStatus") boolean filtrarStatus,
            @Param("statusList") List<SicStatus> statusList,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable);
}