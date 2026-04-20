package com.example.demo.service;

import com.example.demo.model.Equipo;
import com.example.demo.repository.EquipoRepository;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class EquipoService {
    private final EquipoRepository equipoRepository;

    public EquipoService(EquipoRepository equipoRepository) {
        this.equipoRepository = equipoRepository;
    }

    public List<Equipo> buscarEquipoDisponiblePorNombre(String nombre) {
        return equipoRepository.findByNombreContainingIgnoreCaseAndDisponibleTrue(nombre);
    }
}