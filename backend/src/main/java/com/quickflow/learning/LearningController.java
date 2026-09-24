package com.quickflow.learning;

import com.quickflow.learning.LearningDtos.CardRequest;
import com.quickflow.learning.LearningDtos.CardResponse;
import com.quickflow.learning.LearningDtos.MilestoneRequest;
import com.quickflow.learning.LearningDtos.MilestoneUpdate;
import com.quickflow.learning.LearningDtos.NoteRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning-cards")
@Tag(name = "Learning resources")
@ApiResponse(responseCode = "400", description = "Validation failed")
@ApiResponse(responseCode = "404", description = "Card, milestone or note not found")
public class LearningController {

    private final LearningService service;

    public LearningController(LearningService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List learning cards with milestones and notes")
    public List<CardResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a learning card")
    public CardResponse get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @Operation(summary = "Add a learning card")
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<CardResponse> create(@Valid @RequestBody CardRequest request) {
        CardResponse c = service.create(request);
        return ResponseEntity.created(URI.create("/api/learning-cards/" + c.id())).body(c);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a learning card (title, description, status)")
    public CardResponse update(@PathVariable long id, @Valid @RequestBody CardRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a learning card with its milestones and notes")
    @ApiResponse(responseCode = "204", description = "Deleted")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/milestones")
    @Operation(summary = "Add a milestone; returns the card")
    @ApiResponse(responseCode = "201", description = "Added")
    public ResponseEntity<CardResponse> addMilestone(@PathVariable long id, @Valid @RequestBody MilestoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addMilestone(id, request));
    }

    @PatchMapping("/{id}/milestones/{milestoneId}")
    @Operation(summary = "Complete/reopen, rename or re-date a milestone; returns the card")
    public CardResponse updateMilestone(@PathVariable long id, @PathVariable long milestoneId, @Valid @RequestBody MilestoneUpdate request) {
        return service.updateMilestone(id, milestoneId, request);
    }

    @DeleteMapping("/{id}/milestones/{milestoneId}")
    @Operation(summary = "Remove a milestone; returns the card")
    public CardResponse removeMilestone(@PathVariable long id, @PathVariable long milestoneId) {
        return service.removeMilestone(id, milestoneId);
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add a note; returns the card")
    @ApiResponse(responseCode = "201", description = "Added")
    public ResponseEntity<CardResponse> addNote(@PathVariable long id, @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addNote(id, request));
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    @Operation(summary = "Remove a note; returns the card")
    public CardResponse removeNote(@PathVariable long id, @PathVariable long noteId) {
        return service.removeNote(id, noteId);
    }
}
