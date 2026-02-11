package br.com.horizon.portal.infrastructure.persistence.repository;

import br.com.horizon.portal.infrastructure.persistence.entity.ReceitaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface ReceitaRepository extends JpaRepository<ReceitaEntity, Long> {

    // 1. Busca todas as receitas de um ano específico (com paginação para não travar o banco)
    // O Spring gera: SELECT * FROM tb_receita WHERE exercicio = ?
    Page<ReceitaEntity> findByExercicio(Integer exercicio, Pageable pageable);

    // 2. Filtrar por Ano e Mês (Ex: Receitas de Janeiro de 2025)
    Page<ReceitaEntity> findByExercicioAndMes(Integer exercicio, Integer mes, Pageable pageable);

    // 3. Busca textual na Origem (Ex: Buscar tudo que tenha "IPTU" no nome)
    // IgnoreCase faz buscar tanto "iptu" quanto "IPTU"
    Page<ReceitaEntity> findByOrigemContainingIgnoreCase(String termo, Pageable pageable);

    // 4. Query Personalizada: Soma total arrecadada no ano (Para o Dashboard Inicial)
    // COALESCE garante que se não tiver nada, retorna 0 em vez de null
    @Query("SELECT COALESCE(SUM(r.valorArrecadado), 0) FROM ReceitaEntity r WHERE r.exercicio = :exercicio")
    BigDecimal totalArrecadadoPorAno(Integer exercicio);
}