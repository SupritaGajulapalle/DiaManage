package com.diamanage.controller;

import com.diamanage.entity.BloodPressure;
import com.diamanage.service.BloodPressureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blood-pressure")
public class BloodPressureController {
    @Autowired
    private BloodPressureService bloodPressureService;

    @PostMapping("/add")
    public BloodPressure addRecord(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Integer systolic = Integer.valueOf(request.get("systolic").toString());
        Integer diastolic = Integer.valueOf(request.get("diastolic").toString());
        return bloodPressureService.addRecord(userId, systolic, diastolic);
    }

    @GetMapping("/list/{userId}")
    public List<BloodPressure> getRecords(@PathVariable Long userId) {
        return bloodPressureService.getRecords(userId);
    }

}
