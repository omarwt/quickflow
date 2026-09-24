package com.quickflow.plan;

import com.quickflow.plan.PlanDtos.Group;
import com.quickflow.plan.PlanDtos.ItemUpdate;
import com.quickflow.plan.PlanDtos.PlanRequest;
import com.quickflow.plan.PlanDtos.PlanResponse;
import com.quickflow.plan.PlanDtos.Sources;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
@Tag(name = "Plans")
@ApiResponse(responseCode = "400", description = "Validation failed")
@ApiResponse(responseCode = "404", description = "Plan or item not found")
public class PlanController {

    private final PlanService service;

    public PlanController(PlanService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List plans", description = "ACTIVE: not started or in progress, by priority. COMPLETED: history, latest first.")
    public List<PlanResponse> list(@RequestParam(defaultValue = "ALL") Group group) {
        return service.list(group);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a plan with progress and rest time")
    public PlanResponse get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @Operation(summary = "Create a plan from existing tasks, habits and learning resources")
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<PlanResponse> create(@Valid @RequestBody PlanRequest request) {
        PlanResponse p = service.create(request);
        return ResponseEntity.created(URI.create("/api/plans/" + p.id())).body(p);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a plan")
    @ApiResponse(responseCode = "204", description = "Deleted")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/items/{itemId}")
    @Operation(summary = "Mark a plan item done or not done",
            description = "A task item also completes/reopens the task; a habit item records/removes today's completion; a learning item changes only the plan.")
    @ApiResponse(responseCode = "409", description = "The habit behind the item is inactive")
    public PlanResponse setItemDone(@PathVariable long id, @PathVariable long itemId, @Valid @RequestBody ItemUpdate request) {
        return service.setItemDone(id, itemId, request.done());
    }

    @GetMapping("/start-notifications")
    @Operation(summary = "Plans that have started and not been acknowledged yet")
    public List<PlanResponse> startNotifications() {
        return service.startNotifications();
    }

    @PostMapping("/{id}/start-notification/ack")
    @Operation(summary = "Acknowledge a plan's start notification")
    @ApiResponse(responseCode = "409", description = "Plan has not started yet")
    public PlanResponse acknowledgeStart(@PathVariable long id) {
        return service.acknowledgeStart(id);
    }

    @GetMapping("/sources")
    @Operation(summary = "Tasks, habits and learning resources that can be added to a plan")
    public Sources sources() {
        return service.sources();
    }
}
