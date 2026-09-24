package com.quickflow.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DashboardServiceTest {

    @Test
    void completionPercentIsRoundedAndSafeForZero() {
        assertThat(DashboardService.percent(0, 0)).isZero();
        assertThat(DashboardService.percent(1, 3)).isEqualTo(33);
        assertThat(DashboardService.percent(2, 3)).isEqualTo(67);
        assertThat(DashboardService.percent(1, 8)).isEqualTo(13);
        assertThat(DashboardService.percent(4, 4)).isEqualTo(100);
    }
}
