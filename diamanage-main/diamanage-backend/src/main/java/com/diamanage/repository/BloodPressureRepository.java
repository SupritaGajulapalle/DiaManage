package com.diamanage.repository;

import com.diamanage.entity.BloodPressure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BloodPressureRepository extends JpaRepository<BloodPressure, Long> {
    List<BloodPressure> findByUserId(Long userId);
}
