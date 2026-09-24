package com.quickflow.habit;

import com.quickflow.common.ApiException;
import com.quickflow.common.NotFoundException;
import com.quickflow.habit.HabitDtos.CompletionResponse;
import com.quickflow.habit.HabitDtos.HabitRequest;
import com.quickflow.habit.HabitDtos.HabitResponse;
import com.quickflow.settings.SettingsService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class HabitService {

    private final HabitRepository habits;
    private final HabitCompletionRepository completions;
    private final SettingsService time;

    public HabitService(HabitRepository habits, HabitCompletionRepository completions, SettingsService time) {
        this.habits = habits;
        this.completions = completions;
        this.time = time;
    }

    /** @param active null for all habits */
    @Transactional(readOnly = true)
    public List<HabitResponse> list(Boolean active) {
        List<Habit> found = active == null ? habits.findAllByOrderByIdAsc() : habits.findByActiveOrderByIdAsc(active);
        Map<Long, Set<LocalDate>> dates = completions.findByHabitIdIn(found.stream().map(h -> h.id).toList()).stream()
                .collect(Collectors.groupingBy(c -> c.habitId, Collectors.mapping(c -> c.completionDate, Collectors.toSet())));
        LocalDate today = time.today();
        return found.stream()
                .map(h -> HabitResponse.of(h, HabitProgress.of(h.frequency, dates.getOrDefault(h.id, Set.of()), today)))
                .toList();
    }

    @Transactional(readOnly = true)
    public HabitResponse get(long id) {
        return toResponse(load(id));
    }

    /** For other features (plans): empty if the habit was deleted. */
    @Transactional(readOnly = true)
    public Optional<HabitResponse> find(long id) {
        return habits.findById(id).map(this::toResponse);
    }

    @Transactional
    public HabitResponse create(HabitRequest r) {
        Habit h = new Habit();
        h.createdAt = time.now();
        apply(h, r);
        return toResponse(habits.save(h));
    }

    @Transactional
    public HabitResponse update(long id, HabitRequest r) {
        Habit h = load(id);
        apply(h, r);
        return toResponse(h);
    }

    @Transactional
    public HabitResponse setActive(long id, boolean active) {
        Habit h = load(id);
        h.active = active;
        return toResponse(h);
    }

    @Transactional
    public void delete(long id) {
        habits.delete(load(id));
    }

    @Transactional(readOnly = true)
    public List<CompletionResponse> completions(long id) {
        load(id);
        return completions.findByHabitIdOrderByCompletionDateDesc(id).stream().map(CompletionResponse::of).toList();
    }

    /** FR-04 / BR-7: one completion per habit per date. */
    @Transactional
    public HabitResponse complete(long id, LocalDate date) {
        Habit h = load(id);
        LocalDate day = checkDate(h, date);
        if (completions.findByHabitIdAndCompletionDate(id, day).isPresent()) {
            throw ApiException.conflict("Habit " + id + " is already completed for " + day);
        }
        save(id, day);
        return toResponse(h);
    }

    @Transactional
    public HabitResponse uncomplete(long id, LocalDate date) {
        Habit h = load(id);
        completions.delete(completions.findByHabitIdAndCompletionDate(id, date)
                .orElseThrow(() -> new NotFoundException("Completion of habit " + id + " on", date)));
        return toResponse(h);
    }

    /** Plan item done for a habit = habit done today (BR-13, I-6). Idempotent. */
    @Transactional
    public void completeToday(long id) {
        LocalDate today = checkDate(load(id), null);
        if (completions.findByHabitIdAndCompletionDate(id, today).isEmpty()) {
            save(id, today);
        }
    }

    /** Reverse of {@link #completeToday}. Idempotent. */
    @Transactional
    public void uncompleteToday(long id) {
        completions.findByHabitIdAndCompletionDate(id, time.today()).ifPresent(completions::delete);
    }

    private void save(long id, LocalDate day) {
        HabitCompletion c = new HabitCompletion();
        c.habitId = id;
        c.completionDate = day;
        c.createdAt = time.now();
        completions.save(c);
    }

    private LocalDate checkDate(Habit h, LocalDate date) {
        LocalDate today = time.today();
        LocalDate day = date == null ? today : date;
        if (!h.active) {
            throw ApiException.conflict("Habit " + h.id + " is inactive");
        }
        if (day.isAfter(today)) {
            throw ApiException.badRequest("date", "A habit cannot be completed for a future date");
        }
        return day;
    }

    private void apply(Habit h, HabitRequest r) {
        h.name = r.name().trim();
        h.description = StringUtils.hasText(r.description()) ? r.description().trim() : null;
        h.frequency = r.frequency();
    }

    private HabitResponse toResponse(Habit h) {
        Set<LocalDate> dates = completions.findByHabitIdOrderByCompletionDateDesc(h.id).stream()
                .map(c -> c.completionDate).collect(Collectors.toSet());
        return HabitResponse.of(h, HabitProgress.of(h.frequency, dates, time.today()));
    }

    private Habit load(long id) {
        return habits.findById(id).orElseThrow(() -> new NotFoundException("Habit", id));
    }
}
