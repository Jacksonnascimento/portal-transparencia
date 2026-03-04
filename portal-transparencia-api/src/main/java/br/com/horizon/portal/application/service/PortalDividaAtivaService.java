package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.DividaAtivaEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PortalDividaAtivaService {

    public Specification<DividaAtivaEntity> criarSpecificationDivida(String nome, Integer ano) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (ano != null) {
                predicates.add(cb.equal(root.get("anoInscricao"), ano));
            }
            if (nome != null && !nome.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("nomeDevedor")), "%" + nome.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}