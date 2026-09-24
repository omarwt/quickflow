package com.quickflow.settings;

import org.springframework.data.jpa.repository.JpaRepository;

interface SettingsRepository extends JpaRepository<Settings, Long> {
}
