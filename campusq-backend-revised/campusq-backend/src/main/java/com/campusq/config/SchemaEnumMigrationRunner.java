package com.campusq.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaEnumMigrationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaEnumMigrationRunner.class);

    @Bean
    @Order(1)
    CommandLineRunner migrateEnumColumnsToVarchar(JdbcTemplate jdbcTemplate) {
        return args -> {
            String[] statements = {
                "ALTER TABLE customer_orders MODIFY COLUMN status VARCHAR(30) NOT NULL",
                "ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL",
                "ALTER TABLE users MODIFY COLUMN active TINYINT(1) NOT NULL DEFAULT 1",
                "UPDATE users SET active = 1 WHERE active = 0 AND (role IN ('SUPER_ADMIN', 'ADMIN', 'STUDENT', 'STAFF') OR (role = 'VENDOR' AND id IN (SELECT user_id FROM vendors WHERE approval_status <> 'REJECTED')))"
            };
            for (String sql : statements) {
                try {
                    jdbcTemplate.execute(sql);
                    log.info("Schema migration step succeeded: {}", sql);
                } catch (Exception ex) {
                    log.debug("Schema migration step skipped ({}): {}", sql, ex.getMessage());
                }
            }
        };
    }
}
