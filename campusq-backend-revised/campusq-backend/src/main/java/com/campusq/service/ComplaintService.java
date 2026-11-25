package com.campusq.service;

import com.campusq.dto.request.ComplaintCreateRequest;
import com.campusq.dto.request.ComplaintUpdateRequest;
import com.campusq.dto.response.ComplaintResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.Complaint;
import com.campusq.entity.Vendor;
import com.campusq.enums.ComplaintStatus;
import com.campusq.enums.Role;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ForbiddenException;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.ComplaintRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final NotificationService notificationService;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            UserRepository userRepository,
            VendorRepository vendorRepository,
            NotificationService notificationService) {

        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ComplaintResponse submitComplaint(String studentEmail, ComplaintCreateRequest request) {
        AppUser student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (student.getRole() != Role.STUDENT && student.getRole() != Role.STAFF) {
            throw new ForbiddenException("Only students or staff can submit vendor complaints");
        }

        if (student.getCollege() == null) {
            throw new BadRequestException("Account is not assigned to a college");
        }

        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        if (vendor.getUser().getCollege() == null
                || !vendor.getUser().getCollege().getId().equals(student.getCollege().getId())) {
            throw new ForbiddenException("You can only file complaints for vendors in your college");
        }

        Complaint complaint = new Complaint();
        complaint.setStudent(student);
        complaint.setVendor(vendor);
        complaint.setCollege(student.getCollege());
        complaint.setOrderId(request.getOrderId());
        complaint.setSubject(request.getSubject().trim());
        complaint.setMessage(request.getMessage().trim());
        complaint.setStatus(ComplaintStatus.OPEN);

        Complaint saved = complaintRepository.save(complaint);

        List<AppUser> collegeAdmins = userRepository.findByCollegeIdAndRole(
                student.getCollege().getId(),
                Role.ADMIN
        );
        for (AppUser admin : collegeAdmins) {
            notificationService.notifyUser(
                    admin,
                    "New Vendor Complaint",
                    student.getFullName() + " reported an issue with " + vendor.getShopName() + ": " + saved.getSubject(),
                    saved.getOrderId()
            );
        }

        return mapResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints(String studentEmail) {
        return complaintRepository.findByStudentEmailOrderByCreatedAtDesc(studentEmail)
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> getCollegeComplaintsForAdmin(String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);
        return complaintRepository.findByCollegeIdOrderByCreatedAtDesc(admin.getCollege().getId())
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional
    public ComplaintResponse updateComplaintByAdmin(
            Long complaintId,
            String adminEmail,
            ComplaintUpdateRequest request) {

        AppUser admin = getCollegeAdmin(adminEmail);

        Complaint complaint = complaintRepository
                .findByIdAndCollegeId(complaintId, admin.getCollege().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found in your college"));

        complaint.setStatus(request.getStatus());
        if (request.getAdminReply() != null) {
            complaint.setAdminReply(request.getAdminReply().trim());
        }

        Complaint saved = complaintRepository.save(complaint);

        notificationService.notifyUser(
                complaint.getStudent(),
                "Complaint " + saved.getStatus().name(),
                "Your complaint against " + complaint.getVendor().getShopName()
                        + " was marked " + saved.getStatus().name()
                        + (saved.getAdminReply() != null && !saved.getAdminReply().isBlank()
                        ? ": " + saved.getAdminReply()
                        : "."),
                saved.getOrderId()
        );

        return mapResponse(saved);
    }

    private AppUser getCollegeAdmin(String adminEmail) {
        AppUser admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));

        if (admin.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only college admins can manage complaints");
        }

        if (admin.getCollege() == null) {
            throw new BadRequestException("Admin is not assigned to a college");
        }

        return admin;
    }

    private ComplaintResponse mapResponse(Complaint c) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(c.getId());
        response.setStudentId(c.getStudent().getId());
        response.setStudentName(c.getStudent().getFullName());
        response.setStudentEmail(c.getStudent().getEmail());
        response.setVendorId(c.getVendor().getId());
        response.setVendorShopName(c.getVendor().getShopName());
        response.setOrderId(c.getOrderId());
        response.setSubject(c.getSubject());
        response.setMessage(c.getMessage());
        response.setStatus(c.getStatus());
        response.setAdminReply(c.getAdminReply());
        response.setCreatedAt(c.getCreatedAt());
        response.setUpdatedAt(c.getUpdatedAt());
        return response;
    }
}
