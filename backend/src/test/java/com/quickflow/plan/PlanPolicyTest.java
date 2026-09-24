package com.quickflow.plan;

import static org.assertj.core.api.Assertions.assertThat;

import com.quickflow.plan.Plan.Status;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** TR-1 / TR-2: status lifecycle, progress roll-up and rest time. */
class PlanPolicyTest {

    static final Instant START = Instant.parse("2026-09-24T09:00:00Z");
    static final Instant END = Instant.parse("2026-09-24T11:00:00Z");

    @Test
    void lifecycleFollowsTheClock() {
        assertThat(PlanPolicy.status(START.minusSeconds(1), START, END, 0, 3)).isEqualTo(Status.NOT_STARTED);
        assertThat(PlanPolicy.status(START, START, END, 0, 3)).isEqualTo(Status.IN_PROGRESS);
        assertThat(PlanPolicy.status(END.minusSeconds(1), START, END, 2, 3)).isEqualTo(Status.IN_PROGRESS);
        assertThat(PlanPolicy.status(END, START, END, 1, 3)).isEqualTo(Status.COMPLETED);
    }

    @Test
    void allItemsDoneCompletesTheRunningPlan() {
        assertThat(PlanPolicy.status(START.plusSeconds(60), START, END, 3, 3)).isEqualTo(Status.COMPLETED);
    }

    @Test
    void notStartedWinsBeforeTheStartTime() {
        assertThat(PlanPolicy.status(START.minusSeconds(60), START, END, 3, 3)).isEqualTo(Status.NOT_STARTED);
    }

    @Test
    void progressIsDoneOverTotalRounded() {
        assertThat(PlanPolicy.progressPercent(0, 3)).isZero();
        assertThat(PlanPolicy.progressPercent(1, 3)).isEqualTo(33);
        assertThat(PlanPolicy.progressPercent(2, 3)).isEqualTo(67);
        assertThat(PlanPolicy.progressPercent(3, 3)).isEqualTo(100);
        assertThat(PlanPolicy.progressPercent(0, 0)).isZero();
    }

    @Test
    void restTimeOnlyWhileInProgress() {
        Instant now = END.minusSeconds(1800);
        assertThat(PlanPolicy.restSeconds(now, END, Status.IN_PROGRESS)).isEqualTo(1800);
        assertThat(PlanPolicy.restSeconds(now, END, Status.NOT_STARTED)).isNull();
        assertThat(PlanPolicy.restSeconds(now, END, Status.COMPLETED)).isNull();
    }
}
