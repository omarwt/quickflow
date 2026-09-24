package com.quickflow.plan;

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
import java.util.ArrayList;
import java.util.List;

@Entity
public class Plan {

    public enum Status { NOT_STARTED, IN_PROGRESS, COMPLETED }

    public enum SourceType { TASK, HABIT, LEARNING_RESOURCE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String title;
    @Column(name = "estimated_minutes")
    int estimatedMinutes;
    @Column(name = "start_at")
    Instant start;
    @Column(name = "end_at")
    Instant end;
    @Column(name = "priority_order")
    int priorityOrder;
    @Enumerated(EnumType.STRING)
    Status status;
    @Column(name = "created_at", updatable = false)
    Instant createdAt;
    @Column(name = "start_notified_at")
    Instant startNotifiedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "plan_id", nullable = false)
    @OrderBy("id")
    List<Item> items = new ArrayList<>();

    int doneCount() {
        return (int) items.stream().filter(i -> i.done).count();
    }

    @Entity
    @Table(name = "plan_item")
    public static class Item {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        Long id;
        @Enumerated(EnumType.STRING)
        @Column(name = "source_type")
        SourceType sourceType;
        @Column(name = "source_id")
        Long sourceId;
        /** Kept so the item still has a name if its source is deleted (I-5). */
        @Column(name = "title_snapshot")
        String titleSnapshot;
        @Column(name = "is_done")
        boolean done;
    }
}
