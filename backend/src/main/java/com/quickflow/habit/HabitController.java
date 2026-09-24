package com.quickflow.habit;

import com.quickflow.habit.HabitDtos.CompletionRequest;
import com.quickflow.habit.HabitDtos.CompletionResponse;
import com.quickflow.habit.HabitDtos.HabitRequest;
import com.quickflow.habit.HabitDtos.HabitResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/habits")
@Tag(name = "Habits")
@ApiResponse(responseCode = "400", description = "Validation failed")
@ApiResponse(responseCode = "404", description = "Habit not found")
public class HabitController {

    private final HabitService service;

    public HabitController(HabitService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List habits with progress", description = "active=true/false filters; omit for all")
    public List<HabitResponse> list(@RequestParam(required = false) Boolean active) {
        return service.list(active);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a habit")
    public HabitResponse get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @Operation(summary = "Create a habit")
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<HabitResponse> create(@Valid @RequestBody HabitRequest request) {
        HabitResponse h = service.create(request);
        return ResponseEntity.created(URI.create("/api/habits/" + h.id())).body(h);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a habit")
    public HabitResponse update(@PathVariable long id, @Valid @RequestBody HabitRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a habit")
    public HabitResponse deactivate(@PathVariable long id) {
        return service.setActive(id, false);
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate a habit")
    public HabitResponse activate(@PathVariable long id) {
        return service.setActive(id, true);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a habit and its completions")
    @ApiResponse(responseCode = "204", description = "Deleted")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/completions")
    @Operation(summary = "List completions, newest first")
    public List<CompletionResponse> completions(@PathVariable long id) {
        return service.completions(id);
    }

    @PostMapping("/{id}/completions")
    @Operation(summary = "Mark complete for a date (default today); returns the habit with updated progress")
    @ApiResponse(responseCode = "201", description = "Recorded")
    @ApiResponse(responseCode = "409", description = "Already completed for that date, or habit inactive")
    public ResponseEntity<HabitResponse> complete(@PathVariable long id, @RequestBody(required = false) CompletionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.complete(id, request == null ? null : request.date()));
    }

    @DeleteMapping("/{id}/completions/{date}")
    @Operation(summary = "Undo the completion for a date")
    public HabitResponse uncomplete(@PathVariable long id, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.uncomplete(id, date);
    }
}
