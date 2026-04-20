package com.example.demo.repository;

import com.example.demo.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    List<Equipo> findByNombreContainingIgnoreCaseAndDisponibleTrue(String nombre);
}