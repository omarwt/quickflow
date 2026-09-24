package com.quickflow.learning;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "learning_card")
public class LearningCard {

    public enum Status { NOT_STARTED, IN_PROGRESS, COMPLETED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String title;
    String description;
    @Enumerated(EnumType.STRING)
    Status status;
    @Column(name = "created_at", updatable = false)
    Instant createdAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "learning_card_id", nullable = false)
    @OrderBy("id")
    List<Milestone> milestones = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "learning_card_id", nullable = false)
    @OrderBy("id")
    List<Note> notes = new ArrayList<>();

    @Entity
    @Table(name = "learning_milestone")
    public static class Milestone {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        Long id;
        String title;
        @Column(name = "is_done")
        boolean done;
        @Column(name = "target_date")
        LocalDate targetDate;
        @Column(name = "completed_at")
        Instant completedAt;

        /** completedAt follows the done flag (I-15). */
        void setDone(boolean done, Instant now) {
            if (done && !this.done) {
                completedAt = now;
            } else if (!done) {
                completedAt = null;
            }
            this.done = done;
        }
    }

    @Entity
    @Table(name = "learning_note")
    public static class Note {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        Long id;
        String text;
        @Column(name = "created_at")
        Instant createdAt;
    }
}
