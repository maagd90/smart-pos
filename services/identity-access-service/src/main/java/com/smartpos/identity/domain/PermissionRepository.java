package com.smartpos.identity.domain;

import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for permission catalog.
 */
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    /**
     * Finds permissions assigned to a specific role via role_permissions join table.
     */
    @Query("SELECT p.key FROM Permission p JOIN RolePermission rp ON p.id = rp.permissionId WHERE rp.roleId = :roleId")
    Set<String> findPermissionKeysByRoleId(@Param("roleId") UUID roleId);

    /**
     * Finds all permission keys for a user by resolving their roles.
     */
    @Query(value = """
        SELECT DISTINCT p.key FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = :userId
        """, nativeQuery = true)
    Set<String> findPermissionKeysByUserId(@Param("userId") UUID userId);

    /**
     * Finds permission keys for a user scoped to a specific store (or account-wide roles).
     */
    @Query(value = """
        SELECT DISTINCT p.key FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = :userId AND (ur.store_id = :storeId OR ur.store_id IS NULL)
        """, nativeQuery = true)
    Set<String> findPermissionKeysByUserIdAndStoreId(@Param("userId") UUID userId,
                                                     @Param("storeId") UUID storeId);
}
