package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_credor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CredorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cpf_cnpj", nullable = false, unique = true, length = 14)
    private String cpfCnpj;

    @Column(name = "razao_social", nullable = false)
    private String razaoSocial;

    @Column(name = "tipo_pessoa")
    private String tipoPessoa; // "FISICA" ou "JURIDICA"
}