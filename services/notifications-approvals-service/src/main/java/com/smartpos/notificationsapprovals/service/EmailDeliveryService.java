package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import com.smartpos.notificationsapprovals.domain.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(EmailDeliveryService.class);

    private final JavaMailSender mailSender;
    private final NotificationsProperties properties;

    public EmailDeliveryService(JavaMailSender mailSender, NotificationsProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    public void send(Notification notification, String toEmail, String acceptToken, String rejectToken) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        try {
            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(properties.getMailFrom());
            helper.setTo(toEmail);
            helper.setSubject(notification.getTitle());
            String acceptUrl = properties.getPublicBaseUrl() + "/api/v1/notifications/actions/" + acceptToken;
            String rejectUrl = properties.getPublicBaseUrl() + "/api/v1/notifications/actions/" + rejectToken;
            helper.setText("""
                    <html><body>
                    <p>%s</p>
                    <p>%s</p>
                    <p>
                      <a href="%s">Accept</a> |
                      <a href="%s">Reject</a>
                    </p>
                    </body></html>
                    """.formatted(notification.getTitle(), notification.getBody(), acceptUrl, rejectUrl), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Email delivery failed for {}: {}", notification.getId(), e.getMessage());
        }
    }
}
