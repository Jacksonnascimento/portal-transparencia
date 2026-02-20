package br.com.horizon.portal.infrastructure.audit;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LogAuditoriaEvent {
    private String acao;           // Ex: "CRIACAO", "ATUALIZACAO", "EXCLUSAO"
    private String entidade;       // Ex: "RECEITA", "USUARIO"
    private String entidadeId;     // O ID do registro afetado
    private Object dadosAnteriores; // Objeto com o estado anterior
    private Object dadosNovos;      // Objeto com o estado novo
}