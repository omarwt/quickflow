package com.quickflow.task;

import com.quickflow.task.Task.Priority;
import com.quickflow.task.Task.Status;
import com.quickflow.task.TaskDtos.Direction;
import com.quickflow.task.TaskDtos.Due;
import com.quickflow.task.TaskDtos.Sort;
import com.quickflow.task.TaskDtos.TaskRequest;
import com.quickflow.task.TaskDtos.TaskResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/tasks")
@Tag(name = "Tasks")
@ApiResponse(responseCode = "400", description = "Validation failed")
@ApiResponse(responseCode = "404", description = "Task not found")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List tasks", description = "Archived tasks are excluded unless archived=true, which returns only archived tasks.")
    public List<TaskResponse> list(@RequestParam(required = false) String search,
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Due due,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
            @RequestParam(defaultValue = "false") boolean archived,
            @RequestParam(defaultValue = "CREATED_AT") Sort sort,
            @RequestParam(defaultValue = "DESC") Direction direction) {
        return service.list(new TaskService.Query(search, status, priority, due, dueFrom, dueTo, archived, sort, direction));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a task")
    public TaskResponse get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @Operation(summary = "Create a task")
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskRequest request) {
        TaskResponse t = service.create(request);
        return ResponseEntity.created(URI.create("/api/tasks/" + t.id())).body(t);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a task")
    public TaskResponse update(@PathVariable long id, @Valid @RequestBody TaskRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark a task completed (status DONE)")
    public TaskResponse complete(@PathVariable long id) {
        return service.setStatus(id, Status.DONE);
    }

    @PostMapping("/{id}/reopen")
    @Operation(summary = "Reopen a task (status TODO)")
    public TaskResponse reopen(@PathVariable long id) {
        return service.setStatus(id, Status.TODO);
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a task")
    public TaskResponse archive(@PathVariable long id) {
        return service.setArchived(id, true);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore an archived task")
    public TaskResponse restore(@PathVariable long id) {
        return service.setArchived(id, false);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task permanently")
    @ApiResponse(responseCode = "204", description = "Deleted")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
