package com.quickflow.dashboard;

import com.quickflow.habit.HabitDtos.HabitResponse;
import com.quickflow.learning.LearningCard;
import com.quickflow.plan.PlanDtos.PlanResponse;
import com.quickflow.task.TaskDtos.TaskResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Schema(name = "Dashboard", description = "FR-09 summary")
public record DashboardDto(String displayName, LocalDate today, Instant serverTime, Tasks tasks, Habits habits,
        Plans plans, Learning learning) {

    @Schema(name = "DashboardTasks")
    public record Tasks(List<TaskResponse> dueToday, List<TaskResponse> overdue, int completedToday, int total, int done,
            @Schema(description = "Done ÷ all non-archived tasks, rounded (I-16)") int completionPercent) {
    }

    @Schema(name = "DashboardHabits")
    public record Habits(@Schema(description = "Active habits with today's progress") List<HabitResponse> today,
            int active, int completedToday) {
    }

    @Schema(name = "DashboardPlans")
    public record Plans(@Schema(description = "In-progress plans with rest time and progress") List<PlanResponse> inProgress,
            int notStarted, int completed) {
    }

    @Schema(name = "DashboardLearning")
    public record Learning(Map<LearningCard.Status, Integer> cardsByStatus, int milestonesDone, int milestonesTotal,
            @Schema(description = "Milestones completed in the last 7 days (I-15)") int milestonesCompletedLast7Days) {
    }
}
