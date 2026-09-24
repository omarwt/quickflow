package com.quickflow.habit;

import com.quickflow.habit.Habit.Frequency;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public final class HabitDtos {

    private HabitDtos() {
    }

    @Schema(name = "HabitRequest")
    public record HabitRequest(
            @NotBlank(message = "Name is required") @Size(max = 150, message = "Name must be at most 150 characters")
            String name,
            @Size(max = 2000, message = "Description must be at most 2000 characters")
            String description,
            @NotNull(message = "Frequency is required")
            Frequency frequency) {
    }

    @Schema(name = "CompletionRequest")
    public record CompletionRequest(@Schema(description = "Defaults to today; future dates are rejected") LocalDate date) {
    }

    @Schema(name = "Habit")
    public record HabitResponse(long id, String name, String description, Frequency frequency, Instant createdAt,
            boolean active, HabitProgress progress) {

        static HabitResponse of(Habit h, HabitProgress p) {
            return new HabitResponse(h.id, h.name, h.description, h.frequency, h.createdAt, h.active, p);
        }
    }

    @Schema(name = "HabitCompletion")
    public record CompletionResponse(long id, long habitId, LocalDate completionDate, Instant createdAt) {

        static CompletionResponse of(HabitCompletion c) {
            return new CompletionResponse(c.id, c.habitId, c.completionDate, c.createdAt);
        }
    }
}
