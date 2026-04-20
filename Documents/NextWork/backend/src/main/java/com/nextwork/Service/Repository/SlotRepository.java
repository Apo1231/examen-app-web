package com.nextwork.Service.Repository;

import com.nextwork.Model.entity.Slot;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {
    // Slots disponibles de un maestro en una fecha (para que el alumno reserve)
    // Ordenados cronológicamente por hora de inicio
    @Query("SELECT s FROM Slot s WHERE s.maestro.idUsuario = :idMaestro AND s.fecha = :fecha AND s.disponible = true ORDER BY s.horaInicio ASC")
    List<Slot> findByMaestroIdUsuarioAndFechaAndDisponibleTrue(
        @Param("idMaestro") Long idMaestro,
        @Param("fecha") LocalDate fecha
    );

    // Todos los slots de un maestro (para gestión de disponibilidad)
    // Ordenados cronológicamente por fecha y hora de inicio
    @Query("SELECT s FROM Slot s WHERE s.maestro.idUsuario = :idMaestro ORDER BY s.fecha ASC, s.horaInicio ASC")
    List<Slot> findByMaestroIdUsuario(@Param("idMaestro") Long idMaestro);
}
