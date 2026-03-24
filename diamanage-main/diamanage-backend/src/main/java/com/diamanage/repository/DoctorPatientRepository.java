package com.diamanage.repository;

import com.diamanage.entity.DoctorPatient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorPatientRepository extends JpaRepository<DoctorPatient, Long> {
    List<DoctorPatient> findByDoctorId(Long doctorId);
    List<DoctorPatient> findByPatientId(Long patientId);
    DoctorPatient findByDoctorIdAndPatientId(Long doctorId, Long patientId);
    DoctorPatient findFirstByPatientId(Long patientId);
}