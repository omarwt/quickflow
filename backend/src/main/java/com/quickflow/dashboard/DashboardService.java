package com.quickflow.dashboard;

import com.quickflow.habit.HabitDtos.HabitResponse;
import com.quickflow.habit.HabitService;
import com.quickflow.learning.LearningCard;
import com.quickflow.learning.LearningDtos.CardResponse;
import com.quickflow.learning.LearningService;
import com.quickflow.plan.Plan.Status;
import com.quickflow.plan.PlanDtos.Group;
import com.quickflow.plan.PlanDtos.PlanResponse;
import com.quickflow.plan.PlanService;
import com.quickflow.settings.SettingsService;
import com.quickflow.task.Task;
import com.quickflow.task.TaskDtos.TaskResponse;
import com.quickflow.task.TaskService;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-09: read-only roll-up of the other features, computed from the same services the list endpoints use. */
@Service
public class DashboardService {

    private final TaskService tasks;
    private final HabitService habits;
    private final PlanService plans;
    private final LearningService learning;
    private final SettingsService settings;

    public DashboardService(TaskService tasks, HabitService habits, PlanService plans, LearningService learning,
            SettingsService settings) {
        this.tasks = tasks;
        this.habits = habits;
        this.plans = plans;
        this.learning = learning;
        this.settings = settings;
    }

    @Transactional
    public DashboardDto get() {
        ZoneId zone = settings.zone();
        Instant now = settings.now();
        LocalDate today = LocalDate.ofInstant(now, zone);

        List<TaskResponse> active = tasks.listActive();
        int done = (int) active.stream().filter(t -> t.status() == Task.Status.DONE).count();
        var taskSummary = new DashboardDto.Tasks(
                active.stream().filter(t -> today.equals(t.dueDate())).toList(),
                active.stream().filter(TaskResponse::overdue).toList(),
                (int) active.stream().filter(t -> t.completedAt() != null && LocalDate.ofInstant(t.completedAt(), zone).equals(today)).count(),
                active.size(), done, percent(done, active.size()));

        List<HabitResponse> activeHabits = habits.list(true);
        var habitSummary = new DashboardDto.Habits(activeHabits, activeHabits.size(),
                (int) activeHabits.stream().filter(h -> h.progress().completedToday()).count());

        List<PlanResponse> all = plans.list(Group.ALL);
        var planSummary = new DashboardDto.Plans(
                all.stream().filter(p -> p.status() == Status.IN_PROGRESS).toList(),
                (int) all.stream().filter(p -> p.status() == Status.NOT_STARTED).count(),
                (int) all.stream().filter(p -> p.status() == Status.COMPLETED).count());

        List<CardResponse> cards = learning.list();
        Map<LearningCard.Status, Integer> byStatus = new EnumMap<>(LearningCard.Status.class);
        for (LearningCard.Status s : LearningCard.Status.values()) {
            byStatus.put(s, (int) cards.stream().filter(c -> c.status() == s).count());
        }
        Instant weekAgo = now.minusSeconds(7 * 24 * 3600);
        var learningSummary = new DashboardDto.Learning(byStatus,
                cards.stream().mapToInt(CardResponse::milestonesDone).sum(),
                cards.stream().mapToInt(CardResponse::milestonesTotal).sum(),
                (int) cards.stream().flatMap(c -> c.milestones().stream())
                        .filter(m -> m.completedAt() != null && m.completedAt().isAfter(weekAgo)).count());

        return new DashboardDto(settings.get().displayName(), today, now, taskSummary, habitSummary, planSummary, learningSummary);
    }

    /** Rounded percentage, 0 when there is nothing to count. */
    static int percent(int done, int total) {
        return total == 0 ? 0 : Math.round(done * 100f / total);
    }
}
