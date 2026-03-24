package com.diamanage.service;

import com.diamanage.entity.GlucoseRecord;
import com.diamanage.repository.GlucoseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GlucoseService {

    @Autowired
    private GlucoseRepository glucoseRepository;

    public GlucoseRecord addRecord(Long userId, Double value) {
        GlucoseRecord record = new GlucoseRecord();
        record.setUserId(userId);
        record.setValue(value);
        record.setRecordTime(LocalDateTime.now());
        return glucoseRepository.save(record);
    }

    public List<GlucoseRecord> getRecords(Long userId) {
        return glucoseRepository.findByUserId(userId);
    }
}
