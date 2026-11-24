package com.campusq.config;

import com.campusq.entity.College;
import com.campusq.repository.CollegeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CollegeInitializer {

    private static final Logger log = LoggerFactory.getLogger(CollegeInitializer.class);

    @Bean
    public CommandLineRunner initializeCollege(CollegeRepository collegeRepository) {
        return args -> {
            if (!collegeRepository.existsByCollegeCode("MVIT")) {
                College college = new College();
                college.setCollegeName("Sir M. Visvesvaraya Institute of Technology");
                college.setCollegeCode("MVIT");
                college.setAddress("Hunasamaranahalli, Bengaluru, Karnataka");
                college.setActive(true);

                collegeRepository.save(college);
                log.info("Seeded default college: MVIT");
            }
        };
    }
}