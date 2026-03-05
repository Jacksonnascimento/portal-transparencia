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

    
    private String siteOficial;
    private String diarioOficial;
    private String portalContribuinte;
    private String facebook;
    private String instagram;
    private String twitter;

 
    private String emailEntidade;
    private String linkOuvidoria;
    private String telefoneOuvidoria;
    private String emailOuvidoria;

    @Column(columnDefinition = "TEXT")
    private String politicaPrivacidade;

    @Column(columnDefinition = "TEXT")
    private String termosUso;

    @Column(name = "endereco_sic")
    private String enderecoSic;

    @Column(name = "horario_atendimento_sic")
    private String horarioAtendimentoSic;

    @Column(name = "telefone_sic")
    private String telefoneSic;

    @Column(name = "email_sic")
    private String emailSic;

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private String smtpPort;

    @Column(name = "smtp_username")
    private String smtpUsername;

    @Column(name = "smtp_password")
    private String smtpPassword;
}