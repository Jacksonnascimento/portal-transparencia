package br.com.horizon.portal.application.service;

import br.com.horizon.portal.infrastructure.persistence.entity.ConfiguracaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.SicSolicitacaoEntity;
import br.com.horizon.portal.infrastructure.persistence.entity.SicTramiteEntity;
import br.com.horizon.portal.infrastructure.persistence.repository.ConfiguracaoRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Properties;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final ConfiguracaoRepository configuracaoRepository;

    @Async
    public void enviarEmailNotificacaoSic(SicSolicitacaoEntity solicitacao, String assunto) {
        try {
            ConfiguracaoEntity config = configuracaoRepository.findById(1L).orElse(null);
            
            if (config == null || config.getSmtpHost() == null || config.getSmtpHost().isBlank() ||
                config.getSmtpUsername() == null || config.getSmtpUsername().isBlank()) {
                log.warn("Envio de e-mail ignorado: SMTP não configurado.");
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

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String nomeEntidade = config.getNomeEntidade() != null ? config.getNomeEntidade() : "Portal da Transparência";
            helper.setFrom(config.getSmtpUsername(), nomeEntidade + " - e-SIC");
            helper.setTo(solicitacao.getEmail());
            helper.setSubject(assunto);
            
            helper.setText(construirTemplateHtml(solicitacao, config), true); 

            mailSender.send(mimeMessage);
            log.info("E-mail HTML do e-SIC enviado com sucesso para: {}", solicitacao.getEmail());

        } catch (Exception e) {
            log.error("Falha ao enviar e-mail HTML para {}. Motivo: {}", solicitacao.getEmail(), e.getMessage());
        }
    }

    private String construirTemplateHtml(SicSolicitacaoEntity solicitacao, ConfiguracaoEntity config) {
        String nomeEntidade = config.getNomeEntidade() != null ? config.getNomeEntidade() : "Órgão Público";
        String siteOficial = config.getSiteOficial() != null ? config.getSiteOficial() : "#";

        StringBuilder html = new StringBuilder();
        
        html.append("<div style=\"max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;\">");
        
        html.append("<div style=\"background-color: #0f172a; padding: 20px; text-align: center; color: #ffffff;\">");
        html.append("<h2 style=\"margin: 0; font-size: 20px; letter-spacing: 1px;\">").append(nomeEntidade.toUpperCase()).append("</h2>");
        html.append("<p style=\"margin: 5px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;\">Serviço de Informações ao Cidadão (e-SIC)</p>");
        html.append("</div>");

        html.append("<div style=\"padding: 30px;\">");
        html.append("<p style=\"font-size: 16px; margin-top: 0;\">Olá, <strong>").append(solicitacao.getNome()).append("</strong>,</p>");
        html.append("<p style=\"font-size: 15px; line-height: 1.5;\">Esta é uma notificação automática sobre o andamento do seu protocolo <strong>").append(solicitacao.getProtocolo()).append("</strong>.</p>");

        if (solicitacao.getRespostaOficial() != null && !solicitacao.getRespostaOficial().isBlank()) {
            html.append("<div style=\"background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 4px;\">");
            html.append("<h3 style=\"margin-top: 0; color: #166534; font-size: 14px; text-transform: uppercase;\">Resposta Oficial</h3>");
            html.append("<p style=\"margin: 0; font-size: 14px; color: #15803d; white-space: pre-wrap;\">").append(solicitacao.getRespostaOficial().replace("\n", "<br>")).append("</p>");
            html.append("</div>");
        }

        html.append("<h3 style=\"font-size: 14px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;\">Histórico de Trâmites</h3>");
        html.append("<div style=\"margin-top: 15px;\">");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        // Ordenação robusta: Data (desc) e ID (desc) para garantir ordem lógica
        List<SicTramiteEntity> tramites = solicitacao.getTramites().stream()
            .sorted(Comparator.comparing(SicTramiteEntity::getDataTramite)
                    .thenComparing(SicTramiteEntity::getId).reversed())
            .collect(Collectors.toList());

        for(SicTramiteEntity t : tramites) {
            html.append("<div style=\"margin-bottom: 15px; padding-left: 15px; border-left: 2px solid #cbd5e1;\">");
            html.append("<span style=\"font-size: 11px; font-weight: bold; color: #94a3b8;\">").append(t.getDataTramite().format(fmt)).append(" - ").append(formatarStatus(t.getStatus().name())).append("</span>");
            html.append("<p style=\"margin: 4px 0 0 0; font-size: 14px; color: #475569;\">").append(t.getDescricao()).append("</p>");
            html.append("</div>");
        }
        html.append("</div>");

        html.append("<div style=\"margin-top: 30px; text-align: center;\">");
        html.append("<a href=\"").append(siteOficial).append("\" style=\"display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px;\">Acessar Portal da Transparência</a>");
        html.append("</div>");
        
        html.append("</div>");

        html.append("<div style=\"background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;\">");
        html.append("Este é um e-mail automático gerado pelo sistema <strong>Horizon Portal</strong>. Por favor, não responda.");
        html.append("</div>");
        
        html.append("</div>");

        return html.toString();
    }

    private String formatarStatus(String statusEnum) {
        if (statusEnum == null) return "";
        return switch (statusEnum) {
            case "RECEBIDO" -> "Solicitação Recebida";
            case "EM_ANALISE" -> "Em Análise";
            case "PRORROGADO" -> "Prazo Prorrogado";
            case "RESPONDIDO" -> "Pedido Respondido";
            case "NEGADO" -> "Acesso Negado";
            case "RECURSO_SOLICITADO" -> "Recurso em Análise";
            default -> statusEnum;
        };
    }
}