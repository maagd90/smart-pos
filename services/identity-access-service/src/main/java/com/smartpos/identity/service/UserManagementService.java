package com.smartpos.identity.service;

import com.smartpos.identity.domain.Role;
import com.smartpos.identity.domain.RoleRepository;
import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRepository;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository,
                                 UserRoleRepository userRoleRepository,
                                 RoleRepository roleRepository,
                                 BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(UUID accountId, String email, String displayName, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User with email already exists");
        }
        User user = new User(accountId, email, displayName, passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    @Transactional
    public UserRole assignRole(UUID accountId, UUID userId, UUID roleId, UUID storeId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
        if (!role.getAccountId().equals(accountId)) {
            throw new IllegalArgumentException("Role does not belong to account");
        }
        User user = userRepository.findByIdAndAccountId(userId, accountId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return userRoleRepository.save(new UserRole(user.getId(), roleId, storeId));
    }

    public List<User> listUsers(UUID accountId) {
        return userRepository.findByAccountId(accountId);
    }

    public List<Role> listRoles(UUID accountId) {
        return roleRepository.findByAccountId(accountId);
    }
}
