package com.campusq.service;

import com.campusq.dto.request.VendorProfileUpdateRequest;
import com.campusq.dto.request.VendorRegistrationRequest;
import com.campusq.dto.response.VendorApprovalResponse;
import com.campusq.dto.response.VendorRegistrationResponse;
import com.campusq.dto.response.VendorSummaryResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.College;
import com.campusq.entity.Vendor;
import com.campusq.entity.VendorCategory;
import com.campusq.entity.VendorCategoryMapping;
import com.campusq.enums.Role;
import com.campusq.enums.VendorStatus;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ConflictException;
import com.campusq.exception.ForbiddenException;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.CollegeRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorCategoryMappingRepository;
import com.campusq.repository.VendorCategoryRepository;
import com.campusq.repository.VendorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class VendorService {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final VendorCategoryRepository categoryRepository;
    private final VendorCategoryMappingRepository mappingRepository;
    private final PasswordEncoder passwordEncoder;

    public VendorService(
            UserRepository userRepository,
            VendorRepository vendorRepository,
            VendorCategoryRepository categoryRepository,
            VendorCategoryMappingRepository mappingRepository,
            PasswordEncoder passwordEncoder,
            CollegeRepository collegeRepository) {

        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
        this.categoryRepository = categoryRepository;
        this.mappingRepository = mappingRepository;
        this.passwordEncoder = passwordEncoder;
        this.collegeRepository = collegeRepository;
    }

    @Transactional
    public VendorRegistrationResponse registerVendor(VendorRegistrationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String normalizedCode = request.getCollegeCode().trim().toUpperCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email is already registered");
        }

        College college = collegeRepository
                .findByCollegeCode(normalizedCode)
                .filter(College::isActive)
                .orElseThrow(() -> new BadRequestException("Invalid or inactive college code"));

        AppUser user = new AppUser();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.VENDOR);
        user.setCollege(college);

        AppUser savedUser = userRepository.save(user);

        Vendor vendor = new Vendor();
        vendor.setUser(savedUser);
        vendor.setShopName(request.getShopName().trim());
        vendor.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        vendor.setLocation(request.getLocation().trim());
        vendor.setApprovalStatus(VendorStatus.PENDING);
        vendor.setAvailable(false);

        Vendor savedVendor = vendorRepository.save(vendor);

        List<String> savedCategories = saveVendorCategories(savedVendor, request.getCategories());

        VendorRegistrationResponse response = new VendorRegistrationResponse();
        response.setVendorId(savedVendor.getId());
        response.setShopName(savedVendor.getShopName());
        response.setLocation(savedVendor.getLocation());
        response.setApprovalStatus(savedVendor.getApprovalStatus());
        response.setCategories(savedCategories);
        response.setCollegeCode(savedUser.getCollege().getCollegeCode());

        return response;
    }

    @Transactional(readOnly = true)
    public List<VendorApprovalResponse> getPendingVendors(String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);

        return vendorRepository
                .findByUserCollegeIdAndApprovalStatus(admin.getCollege().getId(), VendorStatus.PENDING)
                .stream()
                .map(this::mapVendorApprovalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VendorApprovalResponse> getApprovedVendors(String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);

        return vendorRepository
                .findByUserCollegeIdAndApprovalStatus(admin.getCollege().getId(), VendorStatus.APPROVED)
                .stream()
                .map(this::mapVendorApprovalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VendorApprovalResponse> getAllVendorsForAdmin(String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);

        return vendorRepository
                .findByUserCollegeId(admin.getCollege().getId())
                .stream()
                .map(this::mapVendorApprovalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VendorApprovalResponse getVendorDetailsForAdmin(Long vendorId, String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);
        Vendor vendor = getVendorForAdminCollege(vendorId, admin);
        return mapVendorApprovalResponse(vendor);
    }

    @Transactional
    public VendorApprovalResponse approveVendor(Long vendorId, String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);
        Vendor vendor = getVendorForAdminCollege(vendorId, admin);

        if (vendor.getApprovalStatus() != VendorStatus.PENDING) {
            throw new ConflictException("Only pending vendors can be approved");
        }

        vendor.setApprovalStatus(VendorStatus.APPROVED);
        vendor.setAvailable(true);

        Vendor savedVendor = vendorRepository.save(vendor);
        return mapVendorApprovalResponse(savedVendor);
    }

    @Transactional
    public VendorApprovalResponse rejectVendor(Long vendorId, String adminEmail) {
        AppUser admin = getCollegeAdmin(adminEmail);
        Vendor vendor = getVendorForAdminCollege(vendorId, admin);

        if (vendor.getApprovalStatus() != VendorStatus.PENDING) {
            throw new ConflictException("Only pending vendors can be rejected");
        }

        vendor.setApprovalStatus(VendorStatus.REJECTED);
        vendor.setAvailable(false);

        Vendor savedVendor = vendorRepository.save(vendor);
        return mapVendorApprovalResponse(savedVendor);
    }

    @Transactional(readOnly = true)
    public VendorSummaryResponse getMyVendorProfile(String vendorEmail) {
        Vendor vendor = getVendorByEmail(vendorEmail);
        return mapVendorSummaryResponse(vendor);
    }

    @Transactional
    public VendorSummaryResponse updateMyVendorProfile(
            String vendorEmail,
            VendorProfileUpdateRequest request) {

        Vendor vendor = getVendorByEmail(vendorEmail);

        if (vendor.getApprovalStatus() != VendorStatus.APPROVED) {
            throw new ForbiddenException("Only approved vendors can update shop information");
        }

        vendor.setShopName(request.getShopName().trim());
        vendor.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        vendor.setLocation(request.getLocation().trim());
        vendor.setAvailable(request.getAvailable());

        Vendor savedVendor = vendorRepository.save(vendor);

        if (request.getCategories() != null) {
            if (request.getCategories().isEmpty()) {
                throw new BadRequestException("Select at least one category");
            }
            mappingRepository.deleteByVendorId(savedVendor.getId());
            mappingRepository.flush();
            saveVendorCategories(savedVendor, request.getCategories());
        }

        return mapVendorSummaryResponse(savedVendor);
    }

    @Transactional(readOnly = true)
    public List<VendorSummaryResponse> getAvailableVendorsForStudent(
            String studentEmail,
            String categoryFilter) {

        AppUser student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student account not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new ForbiddenException("Only students can browse campus vendors");
        }

        if (student.getCollege() == null) {
            throw new BadRequestException("Student is not assigned to a college");
        }

        String normalizedCategory = (categoryFilter != null && !categoryFilter.isBlank())
                ? categoryFilter.trim().toUpperCase(Locale.ROOT)
                : null;

        List<Vendor> vendors = vendorRepository
                .findByUserCollegeIdAndApprovalStatusAndAvailableTrue(
                        student.getCollege().getId(),
                        VendorStatus.APPROVED
                );

        return vendors.stream()
                .map(this::mapVendorSummaryResponse)
                .filter(v -> normalizedCategory == null
                        || v.getCategories().contains(normalizedCategory))
                .toList();
    }

    private List<String> saveVendorCategories(Vendor vendor, List<String> categories) {
        Set<String> selectedCategories = new HashSet<>();
        List<String> savedCategories = new ArrayList<>();

        for (String categoryName : categories) {
            String normalizedName = categoryName.trim().toUpperCase(Locale.ROOT);

            if (!selectedCategories.add(normalizedName)) {
                throw new BadRequestException("Duplicate category: " + normalizedName);
            }

            VendorCategory category = categoryRepository
                    .findByName(normalizedName)
                    .orElseThrow(() -> new BadRequestException("Invalid category: " + normalizedName));

            VendorCategoryMapping mapping = new VendorCategoryMapping(vendor, category);
            mappingRepository.save(mapping);
            savedCategories.add(normalizedName);
        }

        return savedCategories;
    }

    private Vendor getVendorByEmail(String vendorEmail) {
        AppUser user = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor account not found"));

        if (user.getRole() != Role.VENDOR) {
            throw new ForbiddenException("Only vendors can access vendor profile");
        }

        return vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found"));
    }

    private Vendor getVendorForAdminCollege(Long vendorId, AppUser admin) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        if (vendor.getUser().getCollege() == null
                || !vendor.getUser().getCollege().getId().equals(admin.getCollege().getId())) {
            throw new ForbiddenException("You cannot access or manage vendors from another college");
        }

        return vendor;
    }

    private AppUser getCollegeAdmin(String adminEmail) {
        AppUser admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));

        if (admin.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only college admins can perform this action");
        }

        if (admin.getCollege() == null) {
            throw new BadRequestException("Admin is not assigned to a college");
        }

        return admin;
    }

    private List<String> getCategoryNames(Long vendorId) {
        return mappingRepository.findByVendorId(vendorId)
                .stream()
                .map(mapping -> mapping.getCategory().getName())
                .toList();
    }

    private VendorApprovalResponse mapVendorApprovalResponse(Vendor vendor) {
        VendorApprovalResponse response = new VendorApprovalResponse();
        response.setVendorId(vendor.getId());
        response.setOwnerName(vendor.getUser().getFullName());
        response.setEmail(vendor.getUser().getEmail());
        response.setShopName(vendor.getShopName());
        response.setDescription(vendor.getDescription());
        response.setLocation(vendor.getLocation());
        response.setApprovalStatus(vendor.getApprovalStatus());
        response.setAvailable(vendor.isAvailable());
        response.setCategories(getCategoryNames(vendor.getId()));
        response.setCollegeCode(vendor.getUser().getCollege().getCollegeCode());
        return response;
    }

    private VendorSummaryResponse mapVendorSummaryResponse(Vendor vendor) {
        VendorSummaryResponse response = new VendorSummaryResponse();
        response.setVendorId(vendor.getId());
        response.setShopName(vendor.getShopName());
        response.setDescription(vendor.getDescription());
        response.setLocation(vendor.getLocation());
        response.setApprovalStatus(vendor.getApprovalStatus());
        response.setAvailable(vendor.isAvailable());
        response.setCategories(getCategoryNames(vendor.getId()));
        response.setCollegeCode(vendor.getUser().getCollege().getCollegeCode());
        return response;
    }
}