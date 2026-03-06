package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.DiariaPassagemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiariaPassagemRepository extends JpaRepository<DiariaPassagemEntity, Long>, JpaSpecificationExecutor<DiariaPassagemEntity> {

    // Método essencial para o front-end: Popula o filtro de anos disponíveis automaticamente
    @Query("SELECT DISTINCT d.exercicio FROM DiariaPassagemEntity d WHERE d.ativo = true ORDER BY d.exercicio DESC")
    List<Integer> findDistinctExercicio();

    // Validação de negócio (Not Exists): Evita duplicar uma mesma diária para a mesma pessoa no mesmo processo
    boolean existsByNumeroProcessoAndNomeFavorecidoAndAtivoTrue(String numeroProcesso, String nomeFavorecido);
}