package com.quickflow.habit;

import static org.assertj.core.api.Assertions.assertThat;

import com.quickflow.habit.Habit.Frequency;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class HabitProgressTest {

    static final LocalDate THU = LocalDate.of(2026, 9, 24);

    @Test
    void dailyStreakCountsBackFromToday() {
        HabitProgress p = HabitProgress.of(Frequency.DAILY, Set.of(THU, THU.minusDays(1), THU.minusDays(2), THU.minusDays(4)), THU);
        assertThat(p.completedToday()).isTrue();
        assertThat(p.currentStreak()).isEqualTo(3);
        assertThat(p.totalCompletions()).isEqualTo(4);
    }

    @Test
    void dailyStreakSurvivesUntilTodayIsOver() {
        assertThat(HabitProgress.of(Frequency.DAILY, Set.of(THU.minusDays(1), THU.minusDays(2)), THU).currentStreak()).isEqualTo(2);
        assertThat(HabitProgress.of(Frequency.DAILY, Set.of(THU.minusDays(2)), THU).currentStreak()).isZero();
    }

    @Test
    void weeklyCountsAnyDayOfTheIsoWeek() {
        HabitProgress p = HabitProgress.of(Frequency.WEEKLY, Set.of(LocalDate.of(2026, 9, 21)), THU); // Monday
        assertThat(p.completedToday()).isFalse();
        assertThat(p.completedThisPeriod()).isTrue();
        assertThat(p.currentStreak()).isEqualTo(1);
    }

    @Test
    void weeklyStreakCountsConsecutiveWeeks() {
        Set<LocalDate> dates = Set.of(LocalDate.of(2026, 9, 17), LocalDate.of(2026, 9, 13), LocalDate.of(2026, 8, 30));
        HabitProgress p = HabitProgress.of(Frequency.WEEKLY, dates, THU);
        assertThat(p.completedThisPeriod()).isFalse();
        assertThat(p.currentStreak()).isEqualTo(2); // weeks of 14 and 7 Sep; the week of 31 Aug is empty
    }
}
