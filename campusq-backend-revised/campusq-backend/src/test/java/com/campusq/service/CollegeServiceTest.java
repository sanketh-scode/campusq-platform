package com.campusq.service;

import com.campusq.dto.request.CollegeCreateRequest;
import com.campusq.dto.response.CollegeResponse;
import com.campusq.dto.response.PublicCollegeResponse;
import com.campusq.entity.College;
import com.campusq.exception.ConflictException;
import com.campusq.repository.CollegeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeServiceTest {

    @Mock
    private CollegeRepository collegeRepository;

    @InjectMocks
    private CollegeService collegeService;

    @Test
    void createCollege_shouldNormalizeCodeAndSave() {
        CollegeCreateRequest request = new CollegeCreateRequest();
        request.setCollegeName("BMS Institute of Technology");
        request.setCollegeCode(" bmsit ");
        request.setAddress("Yelahanka, Bengaluru");

        when(collegeRepository.existsByCollegeCode("BMSIT")).thenReturn(false);
        when(collegeRepository.save(any(College.class))).thenAnswer(inv -> inv.getArgument(0));

        CollegeResponse response = collegeService.createCollege(request);

        assertEquals("BMSIT", response.getCollegeCode());
        assertEquals("BMS Institute of Technology", response.getCollegeName());
        assertTrue(response.isActive());
    }

    @Test
    void createCollege_shouldThrowConflictOnDuplicateCode() {
        CollegeCreateRequest request = new CollegeCreateRequest();
        request.setCollegeName("Duplicate College");
        request.setCollegeCode("mvit");
        request.setAddress("Bengaluru");

        when(collegeRepository.existsByCollegeCode("MVIT")).thenReturn(true);

        assertThrows(ConflictException.class, () -> collegeService.createCollege(request));
    }

    @Test
    void getActivePublicColleges_shouldReturnOnlyRegistrationFields() {
        College college = new College();
        college.setCollegeName("MVIT");
        college.setCollegeCode("MVIT");
        college.setAddress("Bengaluru");
        college.setActive(true);

        when(collegeRepository.findByActiveTrueOrderByCollegeNameAsc()).thenReturn(List.of(college));

        List<PublicCollegeResponse> result = collegeService.getActivePublicColleges();

        assertEquals(1, result.size());
        assertEquals("MVIT", result.get(0).getCollegeCode());
    }
}
