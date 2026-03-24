package com.diamanage.controller;

import com.diamanage.entity.GlucoseRecord;
import com.diamanage.service.GlucoseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins="*")
@RestController
@RequestMapping("/api/glucose")
public class GlucoseController {

    @Autowired
    private GlucoseService glucoseService;

    @PostMapping("/add")
    public GlucoseRecord addRecord(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Double value = Double.valueOf(request.get("value").toString());
        return glucoseService.addRecord(userId, value);
    }

    @GetMapping("/list/{userId}")
    public List<GlucoseRecord> getRecords(@PathVariable Long userId) {
        return glucoseService.getRecords(userId);
    }

}
