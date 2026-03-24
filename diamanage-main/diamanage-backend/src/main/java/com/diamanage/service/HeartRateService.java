package com.diamanage.service;

import com.diamanage.entity.HeatRateRecord;
import com.diamanage.repository.HeartRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class HeartRateService {

    @Autowired
    private HeartRateRepository heartRateRepository;

    public HeatRateRecord addRecord(Long userId, Integer heartRate) {
        HeatRateRecord record = new HeatRateRecord();
        record.setUserId(userId);
        record.setHeartRate(heartRate);
        record.setRecordTime(LocalDateTime.now());
        return heartRateRepository.save(record);
    }

    public List<HeatRateRecord> getRecords(Long userId) {
        return heartRateRepository.findByUserId(userId);
    }
}