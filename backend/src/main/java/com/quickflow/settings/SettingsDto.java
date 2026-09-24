package com.quickflow.settings;

import com.quickflow.settings.Settings.DefaultView;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "Settings", description = "User profile and preferences")
public record SettingsDto(
        @NotBlank(message = "Display name is required") @Size(max = 100, message = "Display name must be at most 100 characters")
        String displayName,
        @Email(message = "Email must be a valid address") @Size(max = 254)
        String email,
        @NotBlank(message = "Timezone is required") @Schema(description = "IANA timezone that decides what 'today' is", example = "Asia/Dubai")
        String timezone,
        @NotNull(message = "notificationsEnabled is required")
        Boolean notificationsEnabled,
        @NotNull(message = "Default view is required")
        DefaultView defaultView) {

    static SettingsDto of(Settings s) {
        return new SettingsDto(s.displayName, s.email, s.timezone, s.notificationsEnabled, s.defaultView);
    }
}
