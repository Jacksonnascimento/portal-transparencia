package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.ServidorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ServidorRepository extends JpaRepository<ServidorEntity, Long>, JpaSpecificationExecutor<ServidorEntity> {

    
    // Método essencial para o Rollback da Importação em lote
    void deleteByIdImportacao(String idImportacao);

    // Validação de duplicidade e unicidade
    boolean existsByCpf(String cpf);
    
    boolean existsByMatricula(String matricula);

    // Adicione esta linha:
    List<ServidorEntity> findAllByIdImportacao(String idImportacao);

}