
package com.example.demo.service;

import com.example.demo.dto.PrestamoDTO;
import com.example.demo.model.Equipo;
import com.example.demo.model.EstadoPrestamo;
import com.example.demo.model.Prestamo;
import com.example.demo.model.Usuario;
import com.example.demo.repository.EquipoRepository;
import com.example.demo.repository.PrestamoRepository;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
public class PrestamoService {
    private final PrestamoRepository prestamoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;

    public PrestamoService(PrestamoRepository p, UsuarioRepository u, EquipoRepository e) {
        this.prestamoRepository = p;
        this.usuarioRepository = u;
        this.equipoRepository = e;
    }

    public Prestamo solicitarPrestamo(PrestamoDTO dto) {
        Usuario user = usuarioRepository.findById(dto.getUsuarioId()).orElseThrow();
        Equipo eq = equipoRepository.findById(dto.getEquipoId()).orElseThrow();

        Prestamo p = new Prestamo();
        p.setUsuario(user);
        p.setEquipo(eq);
        p.setFechaSolicitud(LocalDate.now());

        // VALIDACIONES
        int activos = prestamoRepository.countByUsuarioIdAndEstadoIn(user.getId(),
                Arrays.asList(EstadoPrestamo.SOLICITADO, EstadoPrestamo.APROBADO));

        if (!user.isActivo() || !eq.isDisponible() || activos >= 2) {
            p.setEstado(EstadoPrestamo.RECHAZADO);
        } else {
            p.setEstado(EstadoPrestamo.SOLICITADO);
        }
        return prestamoRepository.save(p);
    }

    public Prestamo aprobarPrestamo(Long id) {
        Prestamo p = prestamoRepository.findById(id).orElseThrow();
        if (p.getEstado() == EstadoPrestamo.SOLICITADO) {
            p.setEstado(EstadoPrestamo.APROBADO);
            p.getEquipo().setDisponible(false); // Punto 2 - 20 pts
            equipoRepository.save(p.getEquipo());
            return prestamoRepository.save(p);
        }
        throw new RuntimeException("Solo se aprueban SOLICITADOS");
    }

    public Prestamo registrarDevolucion(Long id) {
        Prestamo p = prestamoRepository.findById(id).orElseThrow();
        p.setEstado(EstadoPrestamo.DEVUELTO);
        p.setFechaDevolucion(LocalDate.now());
        p.getEquipo().setDisponible(true); // Punto 3 - 20 pts
        equipoRepository.save(p.getEquipo());
        return prestamoRepository.save(p);
    }

    public Prestamo rechazarPrestamo(Long id) {
        Prestamo p = prestamoRepository.findById(id).orElseThrow();
        if (p.getEstado() == EstadoPrestamo.SOLICITADO) {
            p.setEstado(EstadoPrestamo.RECHAZADO); // Punto 4 - 10 pts
            return prestamoRepository.save(p);
        }
        throw new RuntimeException("Estado no válido para rechazar");
    }
}