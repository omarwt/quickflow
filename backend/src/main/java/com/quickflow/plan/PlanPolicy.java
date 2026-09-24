package com.quickflow.plan;

import com.quickflow.plan.Plan.Status;
import java.time.Duration;
import java.time.Instant;

/** FR-08 rules, pure so they can be unit tested (NFR-7). Computed on every read, never stored by timers (NFR-4). */
public final class PlanPolicy {

    private PlanPolicy() {
    }

    /** I-7: before start → NOT_STARTED; all items done or end reached → COMPLETED; otherwise IN_PROGRESS. */
    public static Status status(Instant now, Instant start, Instant end, int done, int total) {
        if (now.isBefore(start)) {
            return Status.NOT_STARTED;
        }
        if ((total > 0 && done == total) || !now.isBefore(end)) {
            return Status.COMPLETED;
        }
        return Status.IN_PROGRESS;
    }

    /** Done ÷ total, rounded to a whole percent. */
    public static int progressPercent(int done, int total) {
        return total == 0 ? 0 : Math.round(done * 100f / total);
    }

    /** BR-12 / I-8: remaining seconds only while in progress, otherwise null. */
    public static Long restSeconds(Instant now, Instant end, Status status) {
        return status == Status.IN_PROGRESS ? Duration.between(now, end).toSeconds() : null;
    }
}
