package br.com.horizon.portal.application.dto.servidor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServidorAdminDTO {

    private Long id;

    @NotBlank(message = "O nome do servidor é obrigatório")
    @Size(min = 3, max = 255, message = "O nome deve ter entre 3 e 255 caracteres")
    private String nome;

    @NotBlank(message = "O CPF é obrigatório")
    @Pattern(regexp = "(^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$)|(^\\d{11}$)", message = "O CPF deve estar no formato 000.000.000-00 ou apenas números")
    private String cpf;

    @NotBlank(message = "A matrícula é obrigatória")
    private String matricula;

    @NotBlank(message = "O cargo é obrigatório")
    private String cargo;

    @NotBlank(message = "A lotação é obrigatória")
    private String lotacao;

    @NotBlank(message = "O tipo de vínculo é obrigatório")
    private String tipoVinculo;

    @NotNull(message = "A data de admissão é obrigatória")
    private LocalDate dataAdmissao;

    private LocalDate dataExoneracao;

    @NotNull(message = "A carga horária é obrigatória")
    @Positive(message = "A carga horária deve ser um valor positivo")
    private Integer cargaHoraria;
    
    // Dados de Terceirizados
    private String empresaContratante;
    
    @Pattern(regexp = "(^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$)|(^\\d{14}$)|(^$)", message = "CNPJ inválido")
    private String cnpjContratante;

    // Dados de Auditoria (Apenas leitura para o Front)
    private String idImportacao;
    private String criadoPor;
    private String atualizadoPor;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

}