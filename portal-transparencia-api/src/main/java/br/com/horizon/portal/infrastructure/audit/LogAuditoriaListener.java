package br.com.horizon.portal.infrastructure.audit;

import br.com.horizon.portal.infrastructure.persistence.entity.LogAuditoriaEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.UsuarioEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.LogAuditoriaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.event.EventListener;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class LogAuditoriaListener {

    private final LogAuditoriaRepository logRepository;
    private final ObjectMapper objectMapper;

    public LogAuditoriaListener(LogAuditoriaRepository logRepository, ObjectMapper objectMapper) {
        this.logRepository = logRepository;
        this.objectMapper = objectMapper;
    }

    // Ouve qualquer disparo de LogAuditoriaEvent no sistema
    @EventListener
    public void registrarLog(LogAuditoriaEvent event) {
        try {
            // 1. Identificar o Utilizador Logado
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            Long usuarioId = null;
            String usuarioNome = "SISTEMA";

            if (authentication != null && authentication.getPrincipal() instanceof UsuarioEntity usuario) {
                usuarioId = usuario.getId();
                usuarioNome = usuario.getNome();
            }

            // 2. Identificar o IP (se a chamada vier de uma requisição web)
            String ipOrigem = "";
            var requestAttributes = RequestContextHolder.getRequestAttributes();
            if (requestAttributes instanceof ServletRequestAttributes servletRequestAttributes) {
                HttpServletRequest request = servletRequestAttributes.getRequest();
                ipOrigem = request.getRemoteAddr();
            }

            // 3. Converter Objetos para JSON de forma segura
            String jsonAnterior = event.getDadosAnteriores() != null ? objectMapper.writeValueAsString(event.getDadosAnteriores()) : null;
            String jsonNovo = event.getDadosNovos() != null ? objectMapper.writeValueAsString(event.getDadosNovos()) : null;

            // 4. Salvar na Caixa-Preta
            LogAuditoriaEntity log = LogAuditoriaEntity.builder()
                    .usuarioId(usuarioId)
                    .usuarioNome(usuarioNome)
                    .acao(event.getAcao())
                    .entidade(event.getEntidade())
                    .entidadeId(event.getEntidadeId())
                    .dadosAnteriores(jsonAnterior)
                    .dadosNovos(jsonNovo)
                    .ipOrigem(ipOrigem)
                    .build();

            logRepository.save(log);

        } catch (Exception e) {
            System.err.println("Falha silenciosa ao gravar log de auditoria: " + e.getMessage());
        }
    }
}