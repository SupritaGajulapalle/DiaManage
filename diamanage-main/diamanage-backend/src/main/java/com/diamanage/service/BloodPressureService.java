package com.diamanage.service;

import com.diamanage.entity.BloodPressure;
import com.diamanage.repository.BloodPressureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BloodPressureService {
    @Autowired
    private BloodPressureRepository bloodPressureRepository;

    public BloodPressure addRecord(Long userId, Integer systolic, Integer diastolic) {
        BloodPressure record = new BloodPressure();
        record.setUserId(userId);
        record.setSystolic(systolic);
        record.setDiastolic(diastolic);
        record.setRecordTime(LocalDateTime.now());
        return bloodPressureRepository.save(record);
    }

    public List<BloodPressure> getRecords(Long userId) {
        return bloodPressureRepository.findByUserId(userId);
    }
    
}
