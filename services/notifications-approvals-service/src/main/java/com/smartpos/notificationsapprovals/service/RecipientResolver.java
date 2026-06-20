package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.domain.NotificationKind;
import com.smartpos.notificationsapprovals.integration.IdentityClient;
import com.smartpos.notificationsapprovals.integration.IdentityClient.ApprovalRecipient;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RecipientResolver {

    private static final long CACHE_TTL_MS = 60_000;

    private final IdentityClient identityClient;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public RecipientResolver(IdentityClient identityClient) {
        this.identityClient = identityClient;
    }

    public List<ApprovalRecipient> resolve(UUID accountId, UUID storeId) {
        String key = accountId + ":" + storeId;
        CacheEntry entry = cache.get(key);
        if (entry != null && entry.expiresAt.isAfter(Instant.now())) {
            return entry.recipients;
        }
        List<ApprovalRecipient> recipients = identityClient.fetchApprovalRecipients(accountId, storeId);
        cache.put(key, new CacheEntry(recipients, Instant.now().plusMillis(CACHE_TTL_MS)));
        return recipients;
    }

    private record CacheEntry(List<ApprovalRecipient> recipients, Instant expiresAt) {
    }
}
