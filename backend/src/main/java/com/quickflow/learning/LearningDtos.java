package com.quickflow.learning;

import com.quickflow.learning.LearningCard.Milestone;
import com.quickflow.learning.LearningCard.Note;
import com.quickflow.learning.LearningCard.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class LearningDtos {

    private LearningDtos() {
    }

    @Schema(name = "LearningCardRequest", description = "Status defaults to NOT_STARTED")
    public record CardRequest(
            @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
            String title,
            @Size(max = 2000, message = "Description must be at most 2000 characters")
            @Schema(description = "Description or source: link, book, course name")
            String description,
            Status status) {
    }

    @Schema(name = "MilestoneRequest")
    public record MilestoneRequest(
            @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
            String title,
            LocalDate targetDate) {
    }

    @Schema(name = "MilestoneUpdate", description = "Only the fields present are changed")
    public record MilestoneUpdate(
            @Size(min = 1, max = 200, message = "Title must be 1-200 characters") String title,
            Boolean done,
            LocalDate targetDate) {
    }

    @Schema(name = "NoteRequest")
    public record NoteRequest(
            @NotBlank(message = "Text is required") @Size(max = 5000, message = "Text must be at most 5000 characters")
            String text) {
    }

    @Schema(name = "Milestone")
    public record MilestoneResponse(long id, String title, boolean done, LocalDate targetDate, Instant completedAt) {
        static MilestoneResponse of(Milestone m) {
            return new MilestoneResponse(m.id, m.title, m.done, m.targetDate, m.completedAt);
        }
    }

    @Schema(name = "Note")
    public record NoteResponse(long id, String text, Instant createdAt) {
        static NoteResponse of(Note n) {
            return new NoteResponse(n.id, n.text, n.createdAt);
        }
    }

    @Schema(name = "LearningCard")
    public record CardResponse(long id, String title, String description, Status status, Instant createdAt,
            List<MilestoneResponse> milestones, List<NoteResponse> notes, int milestonesDone, int milestonesTotal) {

        public static CardResponse of(LearningCard c) {
            int done = (int) c.milestones.stream().filter(m -> m.done).count();
            return new CardResponse(c.id, c.title, c.description, c.status, c.createdAt,
                    c.milestones.stream().map(MilestoneResponse::of).toList(),
                    c.notes.stream().map(NoteResponse::of).toList(), done, c.milestones.size());
        }
    }
}
