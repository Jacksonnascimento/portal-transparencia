package br.com.horizon.portal.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_configuracao_portal")
@Getter @Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class ConfiguracaoEntity {

    @Id
    private Long id; // Será fixo como 1

    private String nomeEntidade;
    private String cnpj;
    private String urlBrasao;
    private String corPrincipal; 
    private String endereco;
    private String telefone;
    private String horarioAtendimento;

    // Novos Campos Adicionados
    private String siteOficial;
    private String diarioOficial;
    private String portalContribuinte;
    private String facebook;
    private String instagram;
    private String twitter;
}