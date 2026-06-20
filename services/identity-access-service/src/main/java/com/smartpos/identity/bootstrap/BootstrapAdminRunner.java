package com.smartpos.identity.bootstrap;

import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRepository;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapAdminRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);
    private static final UUID PLATFORM_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID PLATFORM_ADMIN_ROLE_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${bootstrap.admin.email:}")
    private String bootstrapEmail;

    @Value("${bootstrap.admin.password:}")
    private String bootstrapPassword;

    public BootstrapAdminRunner(UserRepository userRepository,
                                UserRoleRepository userRoleRepository,
                                BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (bootstrapEmail == null || bootstrapEmail.isBlank()
                || bootstrapPassword == null || bootstrapPassword.isBlank()) {
            log.info("Bootstrap admin skipped: BOOTSTRAP_ADMIN_EMAIL/PASSWORD not configured");
            return;
        }

        userRepository.findByEmail(bootstrapEmail).ifPresentOrElse(
                existing -> log.info("Bootstrap admin already exists: {}", bootstrapEmail),
                () -> createBootstrapAdmin());
    }

    private void createBootstrapAdmin() {
        User admin = new User(PLATFORM_ACCOUNT_ID, bootstrapEmail, "Platform Admin",
                passwordEncoder.encode(bootstrapPassword));
        admin.setPlatformAdmin(true);
        userRepository.save(admin);
        userRoleRepository.save(new UserRole(admin.getId(), PLATFORM_ADMIN_ROLE_ID, null));
        log.info("Bootstrap platform admin created: {}", bootstrapEmail);
    }
}
