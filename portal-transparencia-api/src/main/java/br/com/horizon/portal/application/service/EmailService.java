package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Slf4j // Adicionado para permitir o log.error e log.warn
@Service
@RequiredArgsConstructor
public class EmailService {

    private final ConfiguracaoRepository configuracaoRepository;

    @Async // Executa em paralelo para não travar a resposta da API
    public void enviarEmailSic(String destinatario, String assunto, String corpo) {
        try {
            // Busca a configuração SMTP atualizada do banco
            ConfiguracaoEntity config = configuracaoRepository.findById(1L).orElse(null);
            
            // TRAVA DE SEGURANÇA: Se não houver SMTP ou o username(from) estiver vazio, aborta silenciosamente
            if (config == null || config.getSmtpHost() == null || config.getSmtpHost().isBlank() ||
                config.getSmtpUsername() == null || config.getSmtpUsername().isBlank()) {
                log.warn("Envio de e-mail ignorado: SMTP ou Username não configurados no banco de dados.");
                return; 
            }

            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(config.getSmtpHost());
            mailSender.setPort(Integer.parseInt(config.getSmtpPort()));
            mailSender.setUsername(config.getSmtpUsername());
            mailSender.setPassword(config.getSmtpPassword());

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true"); 
            props.put("mail.debug", "false"); 

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(config.getSmtpUsername()); // Agora garantimos que isso nunca será nulo
            message.setTo(destinatario);
            message.setSubject(assunto);
            message.setText(corpo); 

            mailSender.send(message);
            log.info("E-mail do e-SIC enviado com sucesso para: {}", destinatario);

        } catch (Exception e) {
            // Se cair aqui (ex: porta errada, senha inválida), não quebra o sistema.
            log.error("Falha ao enviar e-mail para {}. Motivo: {}", destinatario, e.getMessage());
        }
    }
}