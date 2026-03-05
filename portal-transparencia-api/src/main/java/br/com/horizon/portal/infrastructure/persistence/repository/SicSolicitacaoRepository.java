package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SicSolicitacaoRepository extends JpaRepository<SicSolicitacaoEntity, Long> {
    
    // Consulta pública de acompanhamento blindada (Exige Protocolo + Documento)
    Optional<SicSolicitacaoEntity> findByProtocoloAndDocumento(String protocolo, String documento);
    
    // Consulta interna para ver se um protocolo já existe antes de gerar
    boolean existsByProtocolo(String protocolo);
}