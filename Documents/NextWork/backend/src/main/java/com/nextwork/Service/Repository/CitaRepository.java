package com.nextwork.Service.Repository;

import com.nextwork.Model.entity.Cita;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    // Historial del alumno
    List<Cita> findByAlumnoIdUsuario(Long idAlumno);

    // Historial del maestro con filtros avanzados (todos los params opcionales manejados por servicio)
    List<Cita> findByMaestroIdUsuario(Long idMaestro);

    List<Cita> findByMaestroIdUsuarioAndEstado(
        Long idMaestro,
        EstadoCita estado
    );

    List<Cita> findByMaestroIdUsuarioAndModalidad(
        Long idMaestro,
        Modalidad modalidad
    );

    List<Cita> findByMaestroIdUsuarioAndHoraInicioBetween(
        Long idMaestro,
        LocalDateTime desde,
        LocalDateTime hasta
    );

    List<Cita> findByMaestroIdUsuarioAndEstadoAndModalidadAndHoraInicioBetween(
        Long idMaestro,
        EstadoCita estado,
        Modalidad modalidad,
        LocalDateTime desde,
        LocalDateTime hasta
    );

    // Verificar doble reserva (BR-01)
    boolean existsBySlotIdSlot(Long idSlot);

    // Scheduler: find appointments in given states whose class has already ended
    List<Cita> findByEstadoInAndHoraFinBefore(
        List<EstadoCita> estados,
        LocalDateTime ahora
    );
}
