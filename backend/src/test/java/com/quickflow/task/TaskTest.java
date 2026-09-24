package com.quickflow.task;

import static org.assertj.core.api.Assertions.assertThat;

import com.quickflow.task.Task.Status;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class TaskTest {

    static final Instant T0 = Instant.parse("2026-09-24T08:00:00Z");
    static final Instant T1 = Instant.parse("2026-09-24T09:00:00Z");
    static final LocalDate TODAY = LocalDate.of(2026, 9, 24);

    static Task task(Status status, LocalDate due) {
        Task t = new Task();
        t.dueDate = due;
        t.setStatus(status, T0);
        return t;
    }

    @Test
    void doneSetsCompletedAtAndLeavingDoneClearsIt() {
        Task t = task(Status.TODO, null);
        t.setStatus(Status.DONE, T1);
        assertThat(t.completedAt).isEqualTo(T1);
        t.setStatus(Status.IN_PROGRESS, T1);
        assertThat(t.completedAt).isNull();
    }

    @Test
    void completingTwiceKeepsTheFirstCompletionTime() {
        Task t = task(Status.DONE, null);
        t.setStatus(Status.DONE, T1);
        assertThat(t.completedAt).isEqualTo(T0);
    }

    @Test
    void overdueRule() {
        assertThat(task(Status.TODO, TODAY.minusDays(1)).isOverdue(TODAY)).isTrue();
        assertThat(task(Status.TODO, TODAY).isOverdue(TODAY)).isFalse();
        assertThat(task(Status.TODO, null).isOverdue(TODAY)).isFalse();
        assertThat(task(Status.DONE, TODAY.minusDays(1)).isOverdue(TODAY)).isFalse();
        Task archived = task(Status.TODO, TODAY.minusDays(1));
        archived.archived = true;
        assertThat(archived.isOverdue(TODAY)).isFalse();
    }
}
