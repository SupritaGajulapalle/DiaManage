package com.diamanage.repository;

import com.diamanage.entity.HeatRateRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HeartRateRepository extends JpaRepository<HeatRateRecord, Long> {
        List<HeatRateRecord> findByUserId(Long userId);
}
