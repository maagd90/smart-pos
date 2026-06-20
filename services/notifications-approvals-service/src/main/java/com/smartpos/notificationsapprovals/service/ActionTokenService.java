package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import com.smartpos.notificationsapprovals.domain.ActionToken;
import com.smartpos.notificationsapprovals.domain.ActionTokenRepository;
import com.smartpos.notificationsapprovals.domain.Decision;
import com.smartpos.notificationsapprovals.domain.Notification;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ActionTokenRepository actionTokenRepository;

    public ActionTokenService(ActionTokenRepository actionTokenRepository) {
        this.actionTokenRepository = actionTokenRepository;
    }

    @Transactional
    public String createToken(Notification notification, Decision action) {
        String raw = generateRawToken();
        byte[] hash = hashToken(raw);
        actionTokenRepository.save(new ActionToken(
                hash, notification.getId(), notification.getRecipientUserId(), action, notification.getExpiresAt()));
        return raw;
    }

    public ActionToken lookupValid(String rawToken) {
        byte[] hash = hashToken(rawToken);
        ActionToken token = actionTokenRepository.findByTokenHash(hash).orElse(null);
        if (token == null || token.isUsed() || token.isExpired()) {
            return null;
        }
        return token;
    }

    @Transactional
    public void markUsed(ActionToken token) {
        token.markUsed();
        actionTokenRepository.save(token);
        actionTokenRepository.findByNotificationId(token.getNotificationId()).stream()
                .filter(t -> !java.util.Arrays.equals(t.getTokenHash(), token.getTokenHash()))
                .forEach(sibling -> {
                    if (!sibling.isUsed()) {
                        sibling.markUsed();
                        actionTokenRepository.save(sibling);
                    }
                });
    }

    public static byte[] hashToken(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(raw.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
