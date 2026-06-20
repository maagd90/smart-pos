package com.smartpos.identity.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for user-role assignments.
 */
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUserId(UUID userId);

    List<UserRole> findByUserIdAndStoreId(UUID userId, UUID storeId);

    @Query(value = """
        SELECT ur.* FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN users u ON u.id = ur.user_id
        WHERE u.account_id = :accountId
          AND u.status = 'ACTIVE'
          AND (
            (r.name = 'store_manager' AND ur.store_id = :storeId)
            OR (r.name = 'account_admin' AND ur.store_id IS NULL)
          )
        """, nativeQuery = true)
    List<UserRole> findApprovalRecipients(@Param("accountId") UUID accountId,
                                          @Param("storeId") UUID storeId);
}
