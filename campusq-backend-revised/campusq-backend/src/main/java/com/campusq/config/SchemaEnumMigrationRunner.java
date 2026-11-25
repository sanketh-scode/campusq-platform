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
                "ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL"
            };
            for (String sql : statements) {
                try {
                    jdbcTemplate.execute(sql);
                    log.info("Schema enum check succeeded: {}", sql);
                } catch (Exception ex) {
                    log.debug("Schema enum migration skipped ({}): {}", sql, ex.getMessage());
                }
            }
        };
    }
}
