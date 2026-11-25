package com.campusq.config;

import com.campusq.entity.VendorCategory;
import com.campusq.repository.VendorCategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class CategoryInitializer {

    private static final Logger log = LoggerFactory.getLogger(CategoryInitializer.class);

    @Bean
    CommandLineRunner initializeCategories(VendorCategoryRepository categoryRepository) {
        return args -> {
            List<String> categories = List.of("CANTEEN", "XEROX", "STATIONERY", "OTHER");

            for (String categoryName : categories) {
                if (!categoryRepository.existsByName(categoryName)) {
                    categoryRepository.save(new VendorCategory(categoryName));
                    log.info("Seeded vendor category: {}", categoryName);
                }
            }
        };
    }
}
