package com.quickflow.habit;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findAllByOrderByIdAsc();

    List<Habit> findByActiveOrderByIdAsc(boolean active);
}

interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {

    List<HabitCompletion> findByHabitIdIn(Collection<Long> habitIds);

    List<HabitCompletion> findByHabitIdOrderByCompletionDateDesc(Long habitId);

    Optional<HabitCompletion> findByHabitIdAndCompletionDate(Long habitId, LocalDate date);
}
