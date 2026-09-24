package com.quickflow.settings;

import com.quickflow.common.ApiException;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class SettingsService {

    private final SettingsRepository repository;
    private final Clock clock;

    public SettingsService(SettingsRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public SettingsDto get() {
        return SettingsDto.of(load());
    }

    @Transactional
    public SettingsDto update(SettingsDto dto) {
        try {
            ZoneId.of(dto.timezone());
        } catch (DateTimeException e) {
            throw ApiException.badRequest("timezone", "Unknown timezone '" + dto.timezone() + "'");
        }
        Settings s = load();
        s.displayName = dto.displayName().trim();
        s.email = StringUtils.hasText(dto.email()) ? dto.email().trim() : null;
        s.timezone = dto.timezone();
        s.notificationsEnabled = dto.notificationsEnabled();
        s.defaultView = dto.defaultView();
        return SettingsDto.of(s);
    }

    public Instant now() {
        return clock.instant();
    }

    /** The user's timezone (decision I-2). */
    @Transactional(readOnly = true)
    public ZoneId zone() {
        return ZoneId.of(load().timezone);
    }

    /** "Today" in the user's timezone; every date rule uses this. */
    @Transactional(readOnly = true)
    public LocalDate today() {
        return LocalDate.ofInstant(clock.instant(), zone());
    }

    private Settings load() {
        return repository.findById(1L).orElseThrow();
    }
}
