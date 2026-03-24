package com.diamanage.repository;

import com.diamanage.entity.GlucoseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GlucoseRepository extends JpaRepository<GlucoseRecord, Long> {
    List<GlucoseRecord> findByUserId(Long userId);
}
