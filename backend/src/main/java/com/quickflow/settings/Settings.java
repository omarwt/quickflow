package com.quickflow.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

@Entity
public class Settings {

    public enum DefaultView { DASHBOARD, TASKS, HABITS, LEARNING, PLANS }

    @Id
    Long id;
    @Column(name = "display_name")
    String displayName;
    String email;
    String timezone;
    @Column(name = "notifications_enabled")
    boolean notificationsEnabled;
    @Enumerated(EnumType.STRING)
    @Column(name = "default_view")
    DefaultView defaultView;
}
