package com.quickflow.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface LearningCardRepository extends JpaRepository<LearningCard, Long> {

    List<LearningCard> findAllByOrderByIdAsc();
}
