package com.campusq.controller;

import com.campusq.dto.response.PublicCollegeResponse;
import com.campusq.service.CollegeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/colleges")
public class CollegeController {

    private final CollegeService collegeService;

    public CollegeController(CollegeService collegeService) {
        this.collegeService = collegeService;
    }

    @GetMapping
    public ResponseEntity<List<PublicCollegeResponse>> getActiveColleges() {
        return ResponseEntity.ok(collegeService.getActivePublicColleges());
    }
}
