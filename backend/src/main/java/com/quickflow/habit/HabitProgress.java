package com.quickflow.habit;

import com.quickflow.habit.Habit.Frequency;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Set;

/**
 * Completion progress of a habit (US-HAB-4), from its completion dates. Pure function of the dates and "today".
 * Daily: the period is a day. Weekly: the period is the ISO week (Monday start) and any completion in it counts (I-12).
 * The streak is still alive while the current period isn't completed yet.
 */
public record HabitProgress(boolean completedToday, boolean completedThisPeriod, int currentStreak, int totalCompletions) {

    public static HabitProgress of(Frequency frequency, Set<LocalDate> dates, LocalDate today) {
        int step = frequency == Frequency.DAILY ? 1 : 7;
        LocalDate period = frequency == Frequency.DAILY ? today : today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        boolean thisPeriod = done(dates, period, step);
        LocalDate p = thisPeriod ? period : period.minusDays(step);
        int streak = 0;
        while (done(dates, p, step)) {
            streak++;
            p = p.minusDays(step);
        }
        return new HabitProgress(dates.contains(today), thisPeriod, streak, dates.size());
    }

    private static boolean done(Set<LocalDate> dates, LocalDate start, int days) {
        for (int i = 0; i < days; i++) {
            if (dates.contains(start.plusDays(i))) {
                return true;
            }
        }
        return false;
    }
}
