package com.smartpos.identity.service;

import com.smartpos.identity.api.dto.ApprovalRecipientResponse;
import com.smartpos.identity.domain.PermissionRepository;
import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRepository;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ApprovalRecipientService {

    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    public ApprovalRecipientService(UserRoleRepository userRoleRepository,
                                    UserRepository userRepository,
                                    PermissionRepository permissionRepository) {
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }

    public List<ApprovalRecipientResponse> resolve(UUID accountId, UUID storeId) {
        List<UserRole> assignments = userRoleRepository.findApprovalRecipients(accountId, storeId);
        Map<UUID, ApprovalRecipientResponse> byUser = new LinkedHashMap<>();

        for (UserRole assignment : assignments) {
            User user = userRepository.findById(assignment.getUserId()).orElse(null);
            if (user == null || !accountId.equals(user.getAccountId()) || !"ACTIVE".equals(user.getStatus())) {
                continue;
            }
            Set<String> permissions = permissionRepository.findPermissionKeysByUserIdAndStoreId(
                    user.getId(), storeId);
            byUser.putIfAbsent(user.getId(), new ApprovalRecipientResponse(user.getId(), user.getEmail(), permissions));
        }

        return new ArrayList<>(byUser.values());
    }
}
