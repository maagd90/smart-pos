package com.smartpos.identity.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermission.RolePermissionId> {

    List<RolePermission> findByRoleId(UUID roleId);
}
