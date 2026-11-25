package com.campusq.service;

import com.campusq.dto.response.NotificationResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.Notification;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notifyUser(AppUser user, String title, String message, Long orderId) {
        if (user == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setOrderId(orderId);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String email) {
        return notificationRepository.findTop30ByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return notificationRepository.countByUserEmailAndReadFalse(email);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, String email) {
        Notification notification = notificationRepository
                .findByIdAndUserEmail(notificationId, email)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setRead(true);
        return mapResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(String email) {
        List<Notification> unread = notificationRepository.findByUserEmailAndReadFalse(email);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse mapResponse(Notification n) {
        NotificationResponse response = new NotificationResponse();
        response.setId(n.getId());
        response.setTitle(n.getTitle());
        response.setMessage(n.getMessage());
        response.setOrderId(n.getOrderId());
        response.setRead(n.isRead());
        response.setCreatedAt(n.getCreatedAt());
        return response;
    }
}
