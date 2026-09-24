package com.quickflow.plan;

import com.quickflow.common.ApiException;
import com.quickflow.common.NotFoundException;
import com.quickflow.habit.HabitService;
import com.quickflow.learning.LearningService;
import com.quickflow.plan.Plan.Item;
import com.quickflow.plan.Plan.Status;
import com.quickflow.plan.PlanDtos.Group;
import com.quickflow.plan.PlanDtos.ItemRef;
import com.quickflow.plan.PlanDtos.ItemResponse;
import com.quickflow.plan.PlanDtos.PlanRequest;
import com.quickflow.plan.PlanDtos.PlanResponse;
import com.quickflow.plan.PlanDtos.Source;
import com.quickflow.plan.PlanDtos.Sources;
import com.quickflow.settings.SettingsService;
import com.quickflow.task.Task;
import com.quickflow.task.TaskService;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanService {

    private final PlanRepository plans;
    private final TaskService tasks;
    private final HabitService habits;
    private final LearningService learning;
    private final SettingsService time;

    public PlanService(PlanRepository plans, TaskService tasks, HabitService habits, LearningService learning,
            SettingsService time) {
        this.plans = plans;
        this.tasks = tasks;
        this.habits = habits;
        this.learning = learning;
        this.time = time;
    }

    /** ACTIVE = not started or in progress, by priority then start. COMPLETED = history, most recent end first. */
    @Transactional
    public List<PlanResponse> list(Group group) {
        List<PlanResponse> all = plans.findAllByOrderByPriorityOrderAscStartAsc().stream().map(this::refresh).toList();
        return switch (group) {
            case ALL -> all;
            case ACTIVE -> all.stream().filter(p -> p.status() != Status.COMPLETED).toList();
            case COMPLETED -> all.stream().filter(p -> p.status() == Status.COMPLETED)
                    .sorted(Comparator.comparing(PlanResponse::endDateTime).reversed()).toList();
        };
    }

    @Transactional
    public PlanResponse get(long id) {
        return refresh(load(id));
    }

    @Transactional
    public PlanResponse create(PlanRequest r) {
        Instant start = r.startDateTime().toInstant();
        Instant end = r.endDateTime().toInstant();
        if (!end.isAfter(start)) {
            throw ApiException.badRequest("endDateTime", "End date/time must be after the start date/time"); // BR-11
        }
        Plan plan = new Plan();
        plan.title = r.title().trim();
        plan.estimatedMinutes = r.estimatedMinutes();
        plan.start = start;
        plan.end = end;
        plan.priorityOrder = r.priorityOrder();
        plan.createdAt = time.now();
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < r.items().size(); i++) {
            ItemRef ref = r.items().get(i);
            String field = "items[" + i + "]";
            if (!seen.add(ref.sourceType() + ":" + ref.sourceId())) {
                throw ApiException.badRequest(field, "The same " + ref.sourceType() + " is listed twice");
            }
            Item item = new Item();
            item.sourceType = ref.sourceType();
            item.sourceId = ref.sourceId();
            item.titleSnapshot = selectableTitle(ref).orElseThrow(() -> ApiException.badRequest(field,
                    ref.sourceType() + " " + ref.sourceId() + " does not exist or cannot be planned")); // BR-10
            plan.items.add(item);
        }
        plan.status = PlanPolicy.status(time.now(), start, end, 0, plan.items.size());
        return refresh(plans.save(plan));
    }

    /** US-PLAN-5 with BR-13 (I-6): task and habit items also complete their source; learning items don't. */
    @Transactional
    public PlanResponse setItemDone(long planId, long itemId, boolean done) {
        Plan plan = load(planId);
        Item item = plan.items.stream().filter(i -> i.id == itemId).findFirst()
                .orElseThrow(() -> new NotFoundException("Item", itemId + " in plan " + planId));
        if (item.done != done) {
            item.done = done;
            if (currentTitle(item).isPresent()) {
                switch (item.sourceType) {
                    case TASK -> tasks.setStatus(item.sourceId, done ? Task.Status.DONE : Task.Status.TODO);
                    case HABIT -> {
                        if (done) habits.completeToday(item.sourceId);
                        else habits.uncompleteToday(item.sourceId);
                    }
                    case LEARNING_RESOURCE -> { }
                }
            }
        }
        return refresh(plan);
    }

    @Transactional
    public void delete(long id) {
        plans.delete(load(id));
    }

    /** US-PLAN-7: plans whose start time has arrived and that the user hasn't been told about yet. */
    @Transactional
    public List<PlanResponse> startNotifications() {
        return list(Group.ACTIVE).stream().filter(p -> p.status() == Status.IN_PROGRESS && !p.startNotified()).toList();
    }

    @Transactional
    public PlanResponse acknowledgeStart(long id) {
        Plan plan = load(id);
        if (time.now().isBefore(plan.start)) {
            throw ApiException.conflict("Plan " + id + " has not started yet");
        }
        if (plan.startNotifiedAt == null) {
            plan.startNotifiedAt = time.now();
        }
        return refresh(plan);
    }

    /** I-18: non-archived tasks, active habits, all learning cards. */
    @Transactional(readOnly = true)
    public Sources sources() {
        return new Sources(
                tasks.listActive().stream().map(t -> new Source(t.id(), t.title())).toList(),
                habits.list(true).stream().map(h -> new Source(h.id(), h.name())).toList(),
                learning.list().stream().map(c -> new Source(c.id(), c.title())).toList());
    }

    private Optional<String> selectableTitle(ItemRef ref) {
        return switch (ref.sourceType()) {
            case TASK -> tasks.find(ref.sourceId()).filter(t -> !t.archived()).map(t -> t.title());
            case HABIT -> habits.find(ref.sourceId()).filter(h -> h.active()).map(h -> h.name());
            case LEARNING_RESOURCE -> learning.find(ref.sourceId()).map(c -> c.title());
        };
    }

    private Optional<String> currentTitle(Item item) {
        return switch (item.sourceType) {
            case TASK -> tasks.find(item.sourceId).map(t -> t.title());
            case HABIT -> habits.find(item.sourceId).map(h -> h.name());
            case LEARNING_RESOURCE -> learning.find(item.sourceId).map(c -> c.title());
        };
    }

    /** Recomputes status from stored times and items (NFR-4), stores it, and builds the response. */
    private PlanResponse refresh(Plan p) {
        Instant now = time.now();
        int done = p.doneCount();
        int total = p.items.size();
        p.status = PlanPolicy.status(now, p.start, p.end, done, total);
        List<ItemResponse> items = p.items.stream().map(i -> {
            Optional<String> title = currentTitle(i);
            return new ItemResponse(i.id, i.sourceType, i.sourceId, title.orElse(i.titleSnapshot), i.done, title.isPresent());
        }).toList();
        return new PlanResponse(p.id, p.title, p.estimatedMinutes, p.start, p.end, p.priorityOrder, p.status, p.createdAt,
                items, done, total, PlanPolicy.progressPercent(done, total), PlanPolicy.restSeconds(now, p.end, p.status),
                p.startNotifiedAt != null, now);
    }

    private Plan load(long id) {
        return plans.findById(id).orElseThrow(() -> new NotFoundException("Plan", id));
    }
}
