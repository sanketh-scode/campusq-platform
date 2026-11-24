package com.campusq.config;

import com.campusq.entity.AppUser;
import com.campusq.enums.Role;
import com.campusq.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
public class SuperAdminInitializer {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminInitializer.class);

    @Bean
    public CommandLineRunner createSuperAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.super-admin.email:}") String configuredEmail,
            @Value("${app.super-admin.password:}") String configuredPassword) {

        return args -> {
            if (configuredEmail == null || configuredEmail.isBlank()
                    || configuredPassword == null || configuredPassword.isBlank()) {
                log.info("Super Admin bootstrap skipped: CAMPUSQ_SUPER_ADMIN_EMAIL/PASSWORD not configured.");
                return;
            }

            String normalizedEmail = configuredEmail.trim().toLowerCase(Locale.ROOT);

            if (userRepository.existsByEmail(normalizedEmail)) {
                log.info("Super Admin account already exists.");
                return;
            }

            AppUser admin = new AppUser();
            admin.setFullName("CampusQ Super Admin");
            admin.setEmail(normalizedEmail);
            admin.setPassword(passwordEncoder.encode(configuredPassword));
            admin.setRole(Role.SUPER_ADMIN);
            admin.setCollege(null);

            userRepository.save(admin);
            log.info("Super Admin account bootstrapped successfully.");
        };
    }
}
