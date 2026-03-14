package br.com.horizon.portal.application.dto.servidor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServidorPublicoDTO {

    private Long id;
    private String nome;
    private String cpf; // O Serviço vai preencher este campo já mascarado (LGPD)
    private String matricula;
    private String cargo;
    private String lotacao;
    private String tipoVinculo;
    private LocalDate dataAdmissao;
    private LocalDate dataExoneracao;
    private Integer cargaHoraria;
    
    // Dados de Terceirizados (Exigência do PNTP para o Portal Público)
    private String empresaContratante;
    private String cnpjContratante;

}