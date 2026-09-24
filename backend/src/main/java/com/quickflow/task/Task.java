package com.quickflow.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;

@Entity
public class Task {

    public enum Status { TODO, IN_PROGRESS, DONE }

    public enum Priority { LOW, MEDIUM, HIGH }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String title;
    String description;
    @Enumerated(EnumType.STRING)
    Status status;
    @Enumerated(EnumType.STRING)
    Priority priority;
    @Column(name = "due_date")
    LocalDate dueDate;
    @Column(name = "created_at", updatable = false)
    Instant createdAt;
    @Column(name = "updated_at")
    Instant updatedAt;
    @Column(name = "completed_at")
    Instant completedAt;
    @Column(name = "is_archived")
    boolean archived;

    /** BR-5: entering DONE stamps completedAt, leaving DONE clears it (I-14). */
    void setStatus(Status next, Instant now) {
        if (next == Status.DONE && status != Status.DONE) {
            completedAt = now;
        } else if (next != Status.DONE) {
            completedAt = null;
        }
        status = next;
        updatedAt = now;
    }

    /** I-3: due before today, not done, not archived. */
    boolean isOverdue(LocalDate today) {
        return dueDate != null && dueDate.isBefore(today) && status != Status.DONE && !archived;
    }
}
