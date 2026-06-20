package com.smartpos.identity.service;

import com.smartpos.identity.domain.Role;
import com.smartpos.identity.domain.RolePermission;
import com.smartpos.identity.domain.RolePermissionRepository;
import com.smartpos.identity.domain.RoleRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Copies system role templates into a newly created tenant account.
 */
@Service
public class RoleProvisioningService {

    private static final UUID TEMPLATE_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    /**
     * Creates the role provisioning service.
     *
     * @param roleRepository role persistence
     * @param rolePermissionRepository role-permission join persistence
     */
    public RoleProvisioningService(RoleRepository roleRepository,
                                   RolePermissionRepository rolePermissionRepository) {
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    /**
     * Idempotently provisions system roles for the given account.
     *
     * @param accountId newly created tenant account identifier
     */
    @Transactional
    public void provisionRolesForAccount(UUID accountId) {
        List<Role> existing = roleRepository.findByAccountId(accountId);
        if (!existing.isEmpty()) {
            return;
        }

        List<Role> templates = roleRepository.findByAccountIdAndSystemTrue(TEMPLATE_ACCOUNT_ID);
        for (Role template : templates) {
            Role accountRole = roleRepository.save(new Role(accountId, template.getName(), true));
            for (RolePermission templatePermission : rolePermissionRepository.findByRoleId(template.getId())) {
                rolePermissionRepository.save(new RolePermission(accountRole.getId(), templatePermission.getPermissionId()));
            }
        }
    }
}
