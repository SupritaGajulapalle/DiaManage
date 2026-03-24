package com.diamanage.controller;

import com.diamanage.entity.DoctorPatient;
import com.diamanage.service.DoctorPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins="*")
@RestController
@RequestMapping("/api/doctor-patient")
public class DoctorPatientController {
    
    @Autowired
    private DoctorPatientService doctorPatientService;
    
    @PostMapping("/link")
    public Map<String, Object> link(@RequestBody Map<String, Object> request) {
        Long doctorId = Long.valueOf(request.get("doctorId").toString());
        Long patientId = Long.valueOf(request.get("patientId").toString());
        
        Map<String, Object> response = new HashMap<>();
        DoctorPatient dp = doctorPatientService.link(doctorId, patientId);
        
        if (dp != null) {
            response.put("success", true);
            response.put("message", "Linked successfully");
        } else {
            response.put("success", false);
            response.put("message", "Already linked");
        }
        return response;
    }

    @PostMapping("/link-by-email")
    public Map<String, Object> linkByEmail(@RequestBody Map<String, Object> request) {
        Long doctorId = Long.valueOf(request.get("doctorId").toString());
        String patientEmail = request.get("patientEmail").toString().trim().toLowerCase();

        String result = doctorPatientService.linkPatientByEmail(doctorId, patientEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("success", "Patient linked successfully".equals(result));
        response.put("message", result);

    return response;
}
    
    @GetMapping("/patients/{doctorId}")
    public List<DoctorPatient> getPatients(@PathVariable Long doctorId) {
        return doctorPatientService.getPatientsByDoctor(doctorId);
    }
    
    @GetMapping("/doctors/{patientId}")
    public List<DoctorPatient> getDoctors(@PathVariable Long patientId) {
        return doctorPatientService.getDoctorsByPatient(patientId);
    }
}
