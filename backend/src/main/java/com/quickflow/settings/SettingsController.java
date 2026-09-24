package com.quickflow.settings;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@Tag(name = "Settings")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Get profile and preferences")
    public SettingsDto get() {
        return service.get();
    }

    @PutMapping
    @Operation(summary = "Update profile and preferences")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    public SettingsDto update(@Valid @RequestBody SettingsDto dto) {
        return service.update(dto);
    }
}
