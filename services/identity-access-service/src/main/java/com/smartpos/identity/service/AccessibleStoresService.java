package com.smartpos.identity.service;

import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AccessibleStoresService {

    private final UserRoleRepository userRoleRepository;

    public AccessibleStoresService(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    public AccessibleStoresResult resolve(UUID userId) {
        List<UserRole> roles = userRoleRepository.findByUserId(userId);
        boolean accountWide = roles.stream().anyMatch(r -> r.getStoreId() == null);
        Set<UUID> storeIds = roles.stream()
                .filter(r -> r.getStoreId() != null)
                .map(UserRole::getStoreId)
                .collect(Collectors.toSet());
        return new AccessibleStoresResult(accountWide, storeIds);
    }

    public record AccessibleStoresResult(boolean accountWideAccess, Set<UUID> storeIds) {
    }
}
