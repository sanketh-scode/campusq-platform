package com.campusq.service;

import com.campusq.entity.AppUser;
import com.campusq.entity.College;
import com.campusq.entity.Vendor;
import com.campusq.enums.Role;
import com.campusq.enums.VendorStatus;
import com.campusq.exception.ForbiddenException;
import com.campusq.repository.CollegeRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorCategoryMappingRepository;
import com.campusq.repository.VendorCategoryRepository;
import com.campusq.repository.VendorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private CollegeRepository collegeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VendorRepository vendorRepository;
    @Mock
    private VendorCategoryRepository categoryRepository;
    @Mock
    private VendorCategoryMappingRepository mappingRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private VendorService vendorService;

    @Test
    void approveVendor_shouldBlockCrossCollegeAdmin() throws Exception {
        College mvit = new College();
        setId(mvit, 1L);
        mvit.setCollegeCode("MVIT");

        College otherCollege = new College();
        setId(otherCollege, 2L);
        otherCollege.setCollegeCode("BMSIT");

        AppUser mvitAdmin = new AppUser();
        setId(mvitAdmin, 10L);
        mvitAdmin.setEmail("admin@mvit.edu");
        mvitAdmin.setRole(Role.ADMIN);
        mvitAdmin.setCollege(mvit);

        AppUser otherVendorUser = new AppUser();
        setId(otherVendorUser, 20L);
        otherVendorUser.setCollege(otherCollege);

        Vendor otherVendor = new Vendor();
        setId(otherVendor, 200L);
        otherVendor.setUser(otherVendorUser);
        otherVendor.setApprovalStatus(VendorStatus.PENDING);

        when(userRepository.findByEmail("admin@mvit.edu")).thenReturn(Optional.of(mvitAdmin));
        when(vendorRepository.findById(200L)).thenReturn(Optional.of(otherVendor));

        assertThrows(ForbiddenException.class, () -> vendorService.approveVendor(200L, "admin@mvit.edu"));
    }

    private static void setId(Object entity, Long id) throws Exception {
        Field idField = entity.getClass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }
}
