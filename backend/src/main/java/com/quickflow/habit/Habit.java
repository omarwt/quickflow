package com.quickflow.habit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;

@Entity
public class Habit {

    public enum Frequency { DAILY, WEEKLY }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String name;
    String description;
    @Enumerated(EnumType.STRING)
    Frequency frequency;
    @Column(name = "created_at", updatable = false)
    Instant createdAt;
    @Column(name = "is_active")
    boolean active = true;
}
