package com.quickflow;

import static org.assertj.core.api.Assertions.assertThat;

import com.quickflow.settings.SettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Boots the whole app on an in-memory database: migrations and entity mappings must agree. */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:test;DB_CLOSE_DELAY=-1")
class ApplicationTest {

    @Autowired
    SettingsService settings;

    @Test
    void startsWithDefaultSettings() {
        assertThat(settings.get().displayName()).isEqualTo("QuickFlow user");
    }
}
