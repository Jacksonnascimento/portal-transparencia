package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final ConfiguracaoRepository configuracaoRepository;

    @Async // Executa em paralelo para não travar a resposta da API
    public void enviarEmailSic(String destinatario, String assunto, String corpo) {
        // Busca a configuração SMTP atualizada do banco
        ConfiguracaoEntity config = configuracaoRepository.findById(1L).orElse(null);
        
        if (config == null || config.getSmtpHost() == null || config.getSmtpHost().isBlank()) {
            return; // Se não houver SMTP configurado, sai silenciosamente
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
        props.put("mail.debug", "false"); // Mude para true se precisar debugar erros de conexão

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(config.getSmtpUsername());
        message.setTo(destinatario);
        message.setSubject(assunto);
        message.setText(corpo); // <-- CORRIGIDO AQUI (de 'corpa' para 'corpo')

        mailSender.send(message);
    }
}