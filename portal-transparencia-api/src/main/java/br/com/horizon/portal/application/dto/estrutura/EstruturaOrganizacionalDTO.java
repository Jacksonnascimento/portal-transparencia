package br.com.horizon.portal.application.dto.estrutura;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstruturaOrganizacionalDTO {
    
    private UUID id;
    private String nomeOrgao;
    private String sigla;
    private String nomeDirigente;
    private String cargoDirigente;
    private String horarioAtendimento;
    private String enderecoCompleto;
    private String telefoneContato;
    private String emailInstitucional;
    private String linkCurriculo;
    
    // NOVO: Campo para trafegar a URL da Foto Institucional do Dirigente
    private String urlFotoDirigente;
    
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
}