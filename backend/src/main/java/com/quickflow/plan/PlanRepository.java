package com.quickflow.plan;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface PlanRepository extends JpaRepository<Plan, Long> {

    List<Plan> findAllByOrderByPriorityOrderAscStartAsc();
}
