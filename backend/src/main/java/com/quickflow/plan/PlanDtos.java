package com.quickflow.plan;

import com.quickflow.plan.Plan.SourceType;
import com.quickflow.plan.Plan.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public final class PlanDtos {

    private PlanDtos() {
    }

    @Schema(name = "PlanItemRef", description = "An existing task, habit or learning card")
    public record ItemRef(@NotNull(message = "sourceType is required") SourceType sourceType,
            @NotNull(message = "sourceId is required") Long sourceId) {
    }

    @Schema(name = "PlanRequest")
    public record PlanRequest(
            @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
            String title,
            @NotEmpty(message = "A plan needs at least one item") @Valid
            List<ItemRef> items,
            @NotNull(message = "Estimated duration is required") @Min(value = 1, message = "Estimated duration must be at least 1 minute")
            @Max(value = 100000, message = "Estimated duration is too large")
            @Schema(description = "Estimated duration in minutes")
            Integer estimatedMinutes,
            @NotNull(message = "Start date/time is required") @Schema(example = "2026-09-24T09:00:00+03:00")
            OffsetDateTime startDateTime,
            @NotNull(message = "End date/time is required") @Schema(example = "2026-09-24T11:00:00+03:00")
            OffsetDateTime endDateTime,
            @NotNull(message = "Priority order is required") @Min(value = 1, message = "Priority order must be 1 or more")
            @Schema(description = "1 = highest priority")
            Integer priorityOrder) {
    }

    @Schema(name = "PlanItemUpdate")
    public record ItemUpdate(@NotNull(message = "done is required") Boolean done) {
    }

    @Schema(name = "PlanItem")
    public record ItemResponse(long id, SourceType sourceType, long sourceId, String title, boolean done,
            @Schema(description = "false when the source was deleted (I-5)") boolean sourceAvailable) {
    }

    @Schema(name = "Plan")
    public record PlanResponse(long id, String title, int estimatedMinutes, Instant startDateTime, Instant endDateTime,
            int priorityOrder, Status status, Instant createdAt, List<ItemResponse> items, int doneCount, int totalCount,
            int progressPercent,
            @Schema(description = "Seconds until end while IN_PROGRESS, otherwise null") Long restSeconds,
            boolean startNotified,
            @Schema(description = "Server time used for the computation; clients count down from it") Instant serverTime) {
    }

    @Schema(name = "PlanSource")
    public record Source(long id, String title) {
    }

    @Schema(name = "PlanSources", description = "Items that can be added to a plan (I-18)")
    public record Sources(List<Source> tasks, List<Source> habits, List<Source> learningResources) {
    }

    public enum Group { ACTIVE, COMPLETED, ALL }
}
