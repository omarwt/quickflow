package com.quickflow.task;

import com.quickflow.common.ApiException;
import com.quickflow.common.NotFoundException;
import com.quickflow.settings.SettingsService;
import com.quickflow.task.Task.Priority;
import com.quickflow.task.Task.Status;
import com.quickflow.task.TaskDtos.Direction;
import com.quickflow.task.TaskDtos.Due;
import com.quickflow.task.TaskDtos.Sort;
import com.quickflow.task.TaskDtos.TaskRequest;
import com.quickflow.task.TaskDtos.TaskResponse;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TaskService {

    private final TaskRepository repository;
    private final SettingsService time;

    public TaskService(TaskRepository repository, SettingsService time) {
        this.repository = repository;
        this.time = time;
    }

    public record Query(String search, Status status, Priority priority, Due due, LocalDate dueFrom, LocalDate dueTo,
            boolean archived, Sort sort, Direction direction) {
    }

    /** FR-02: search, filters and sorting in one query. Archived tasks only when asked for (BR-4). */
    @Transactional(readOnly = true)
    public List<TaskResponse> list(Query q) {
        if (q.dueFrom() != null && q.dueTo() != null && q.dueFrom().isAfter(q.dueTo())) {
            throw ApiException.badRequest("dueFrom", "dueFrom must not be after dueTo");
        }
        LocalDate today = time.today();
        Specification<Task> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            Expression<LocalDate> due = root.get("dueDate");
            where.add(cb.equal(root.get("archived"), q.archived()));
            if (StringUtils.hasText(q.search())) {
                String like = "%" + q.search().trim().toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                where.add(cb.like(cb.lower(root.get("title")), like, '\\'));
            }
            if (q.status() != null) where.add(cb.equal(root.get("status"), q.status()));
            if (q.priority() != null) where.add(cb.equal(root.get("priority"), q.priority()));
            if (q.dueFrom() != null) where.add(cb.greaterThanOrEqualTo(due, q.dueFrom()));
            if (q.dueTo() != null) where.add(cb.lessThanOrEqualTo(due, q.dueTo()));
            if (q.due() != null) {
                where.add(switch (q.due()) {
                    case TODAY -> cb.equal(due, today);
                    case OVERDUE -> cb.and(cb.lessThan(due, today), cb.notEqual(root.get("status"), Status.DONE));
                    case UPCOMING -> cb.greaterThan(due, today);
                    case NONE -> cb.isNull(due);
                });
            }
            boolean asc = q.direction() == Direction.ASC;
            if (q.sort() == Sort.DUE_DATE) {
                // tasks without a due date go last in both directions
                query.orderBy(cb.asc(cb.selectCase().when(cb.isNull(due), 1).otherwise(0)),
                        asc ? cb.asc(due) : cb.desc(due), cb.desc(root.get("id")));
            } else {
                query.orderBy(asc ? cb.asc(root.get("id")) : cb.desc(root.get("id")));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
        return repository.findAll(spec).stream().map(t -> TaskResponse.of(t, today)).toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse get(long id) {
        return TaskResponse.of(load(id), time.today());
    }

    /** For other features (plans, dashboard): empty if the task was deleted. */
    @Transactional(readOnly = true)
    public Optional<TaskResponse> find(long id) {
        return repository.findById(id).map(t -> TaskResponse.of(t, time.today()));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listActive() {
        LocalDate today = time.today();
        return repository.findAll().stream().filter(t -> !t.archived).map(t -> TaskResponse.of(t, today)).toList();
    }

    @Transactional
    public TaskResponse create(TaskRequest r) {
        Task t = new Task();
        t.createdAt = time.now();
        t.priority = Priority.MEDIUM;
        apply(t, r);
        return TaskResponse.of(repository.save(t), time.today());
    }

    @Transactional
    public TaskResponse update(long id, TaskRequest r) {
        Task t = load(id);
        apply(t, r);
        return TaskResponse.of(t, time.today());
    }

    @Transactional
    public TaskResponse setStatus(long id, Status status) {
        Task t = load(id);
        t.setStatus(status, time.now());
        return TaskResponse.of(t, time.today());
    }

    @Transactional
    public TaskResponse setArchived(long id, boolean archived) {
        Task t = load(id);
        t.archived = archived;
        t.updatedAt = time.now();
        return TaskResponse.of(t, time.today());
    }

    @Transactional
    public void delete(long id) {
        repository.delete(load(id));
    }

    private void apply(Task t, TaskRequest r) {
        t.title = r.title().trim();
        t.description = StringUtils.hasText(r.description()) ? r.description().trim() : null;
        if (r.priority() != null) t.priority = r.priority();
        t.dueDate = r.dueDate();
        t.setStatus(r.status() == null ? Status.TODO : r.status(), time.now());
    }

    private Task load(long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Task", id));
    }
}
