package com.campusq.service;

import com.campusq.dto.request.CollegeCreateRequest;
import com.campusq.dto.response.CollegeResponse;
import com.campusq.dto.response.PublicCollegeResponse;
import com.campusq.entity.College;
import com.campusq.exception.ConflictException;
import com.campusq.repository.CollegeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CollegeService {

    private final CollegeRepository collegeRepository;

    public CollegeService(CollegeRepository collegeRepository) {
        this.collegeRepository = collegeRepository;
    }

    @Transactional
    public CollegeResponse createCollege(CollegeCreateRequest request) {
        String normalizedCode = request.getCollegeCode().trim().toUpperCase(Locale.ROOT);

        if (collegeRepository.existsByCollegeCode(normalizedCode)) {
            throw new ConflictException("College code already exists: " + normalizedCode);
        }

        College college = new College();
        college.setCollegeName(request.getCollegeName().trim());
        college.setCollegeCode(normalizedCode);
        college.setAddress(request.getAddress().trim());
        college.setActive(request.getActive() == null || request.getActive());

        College saved = collegeRepository.save(college);
        return mapCollegeResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CollegeResponse> getAllColleges() {
        return collegeRepository.findAllByOrderByCollegeNameAsc()
                .stream()
                .map(this::mapCollegeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicCollegeResponse> getActivePublicColleges() {
        return collegeRepository.findByActiveTrueOrderByCollegeNameAsc()
                .stream()
                .map(this::mapPublicCollegeResponse)
                .toList();
    }

    private CollegeResponse mapCollegeResponse(College college) {
        CollegeResponse response = new CollegeResponse();
        response.setId(college.getId());
        response.setCollegeName(college.getCollegeName());
        response.setCollegeCode(college.getCollegeCode());
        response.setAddress(college.getAddress());
        response.setActive(college.isActive());
        response.setCreatedAt(college.getCreatedAt());
        return response;
    }

    private PublicCollegeResponse mapPublicCollegeResponse(College college) {
        PublicCollegeResponse response = new PublicCollegeResponse();
        response.setId(college.getId());
        response.setCollegeName(college.getCollegeName());
        response.setCollegeCode(college.getCollegeCode());
        response.setAddress(college.getAddress());
        return response;
    }
}
