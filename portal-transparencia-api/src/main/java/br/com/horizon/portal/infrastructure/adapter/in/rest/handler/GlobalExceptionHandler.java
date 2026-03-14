package br.com.horizon.portal.infrastructure.adapter.in.rest.handler;

import lombok.Builder;
import lombok.Getter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Erros de Validação (Anotações @NotBlank, @CPF, etc nos DTOs)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.builder()
                        .timestamp(LocalDateTime.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Erro de validação nos campos enviados")
                        .details(errors)
                        .build());
    }

    // 2. Erros de Integridade de Dados (Ex: CPF Duplicado, Deleção de item com vínculo)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.builder()
                        .timestamp(LocalDateTime.now())
                        .status(HttpStatus.CONFLICT.value())
                        .message("Conflito de integridade de dados")
                        .details(List.of("Já existe um registro com estes dados ou o item possui vínculos ativos."))
                        .build());
    }

    // 3. Erro Genérico (O "Seguro de Vida" para erros 500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleInternalError(Exception ex) {
        // Logamos o erro real no console/arquivo para nós (Tech Leads) vermos
        ex.printStackTrace(); 
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.builder()
                        .timestamp(LocalDateTime.now())
                        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .message("Ocorreu um erro interno no servidor")
                        .details(List.of("Por favor, tente novamente mais tarde ou contate o suporte."))
                        .build());
    }

    // Classe auxiliar para formatar a resposta JSON de erro
    @Getter
    @Builder
    public static class ErrorResponse {
        private LocalDateTime timestamp;
        private int status;
        private String message;
        private List<String> details;
    }
}