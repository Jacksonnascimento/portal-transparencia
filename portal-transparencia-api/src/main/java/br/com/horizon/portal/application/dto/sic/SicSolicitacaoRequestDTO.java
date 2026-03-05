package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.enums.SicTipo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SicSolicitacaoRequestDTO {
    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O documento (CPF/CNPJ) é obrigatório")
    private String documento;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "E-mail com formato inválido")
    private String email;

    @NotNull(message = "O tipo da solicitação é obrigatório")
    private SicTipo tipoSolicitacao;

    @NotBlank(message = "A mensagem é obrigatória")
    private String mensagem;

    private String urlAnexoSolicitacao; // Opcional
    
    @NotNull(message = "A opção de sigilo deve ser informada")
    private Boolean sigilo;
}