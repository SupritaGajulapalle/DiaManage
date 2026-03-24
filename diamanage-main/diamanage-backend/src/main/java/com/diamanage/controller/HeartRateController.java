package com.diamanage.controller;

import com.diamanage.entity.HeatRateRecord;
import com.diamanage.service.HeartRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/heartrate")
public class HeartRateController {

    @Autowired
    private HeartRateService heartRateService;

    @PostMapping("/add")
    public HeatRateRecord addRecord(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Integer heartRate = Integer.valueOf(request.get("heartRate").toString());
        return heartRateService.addRecord(userId, heartRate);
    }
    
    @GetMapping("/list/{userId}")
    public List<HeatRateRecord> getRecords(@PathVariable Long userId) {
        return heartRateService.getRecords(userId);
    }
    
}
