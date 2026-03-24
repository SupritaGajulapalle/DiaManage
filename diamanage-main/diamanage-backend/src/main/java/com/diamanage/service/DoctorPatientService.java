package com.diamanage.service;

import com.diamanage.entity.DoctorPatient;
import com.diamanage.repository.DoctorPatientRepository;
import com.diamanage.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

import com.diamanage.entity.User;


@Service
public class DoctorPatientService {
    
    @Autowired
    private DoctorPatientRepository doctorPatientRepository;
    
    public DoctorPatient link(Long doctorId, Long patientId) {
        if (doctorPatientRepository.findByDoctorIdAndPatientId(doctorId, patientId) != null) {
            return null;
        }
        DoctorPatient dp = new DoctorPatient();
        dp.setDoctorId(doctorId);
        dp.setPatientId(patientId);
        dp.setLinkedAt(LocalDateTime.now());
        return doctorPatientRepository.save(dp);
    }
    
    public List<DoctorPatient> getPatientsByDoctor(Long doctorId) {
        return doctorPatientRepository.findByDoctorId(doctorId);
    }
    
    public List<DoctorPatient> getDoctorsByPatient(Long patientId) {
        return doctorPatientRepository.findByPatientId(patientId);
    }


    @Autowired
    private UserRepository userRepository;

    public String linkPatientByEmail(Long doctorId, String patientEmail) {
    User patient = userRepository.findByEmail(patientEmail);

    if (patient == null) {
        return "Patient not found";
    }

    if (!"PATIENT".equalsIgnoreCase(patient.getRole())) {
        return "User is not a patient";
    }

    DoctorPatient existingDoctor = doctorPatientRepository.findFirstByPatientId(patient.getId());
    if (existingDoctor != null) {
        return "User already has a doctor";
    }

    DoctorPatient doctorPatient = new DoctorPatient();
    doctorPatient.setDoctorId(doctorId);
    doctorPatient.setPatientId(patient.getId());
    doctorPatient.setLinkedAt(LocalDateTime.now());

    doctorPatientRepository.save(doctorPatient);

    return "Patient linked successfully";
}
}