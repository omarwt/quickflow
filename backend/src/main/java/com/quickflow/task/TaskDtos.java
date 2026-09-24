package com.quickflow.task;

import com.quickflow.task.Task.Priority;
import com.quickflow.task.Task.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public final class TaskDtos {

    private TaskDtos() {
    }

    @Schema(name = "TaskRequest", description = "Status defaults to TODO, priority to MEDIUM")
    public record TaskRequest(
            @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
            String title,
            @Size(max = 2000, message = "Description must be at most 2000 characters")
            String description,
            Status status,
            Priority priority,
            LocalDate dueDate) {
    }

    @Schema(name = "Task")
    public record TaskResponse(long id, String title, String description, Status status, Priority priority,
            LocalDate dueDate, Instant createdAt, Instant updatedAt, Instant completedAt, boolean archived,
            @Schema(description = "Due before today, not done, not archived") boolean overdue) {

        public static TaskResponse of(Task t, LocalDate today) {
            return new TaskResponse(t.id, t.title, t.description, t.status, t.priority, t.dueDate, t.createdAt,
                    t.updatedAt, t.completedAt, t.archived, t.isOverdue(today));
        }
    }

    /** Due-date shortcuts (I-20). */
    public enum Due { TODAY, OVERDUE, UPCOMING, NONE }

    public enum Sort { DUE_DATE, CREATED_AT }

    public enum Direction { ASC, DESC }
}
