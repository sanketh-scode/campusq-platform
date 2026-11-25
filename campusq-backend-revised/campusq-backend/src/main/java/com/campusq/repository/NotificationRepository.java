package com.campusq.repository;

import com.campusq.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop30ByUserEmailOrderByCreatedAtDesc(String email);

    long countByUserEmailAndReadFalse(String email);

    Optional<Notification> findByIdAndUserEmail(Long id, String email);

    List<Notification> findByUserEmailAndReadFalse(String email);
}
