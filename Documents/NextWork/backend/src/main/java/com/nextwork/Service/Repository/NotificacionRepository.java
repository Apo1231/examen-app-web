package com.nextwork.Service.Repository;

import com.nextwork.Model.entity.Notificacion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacionRepository
    extends JpaRepository<Notificacion, Long>
{
    // Notificaciones asociadas a una cita
    List<Notificacion> findByCitaIdCita(Long idCita);
}
