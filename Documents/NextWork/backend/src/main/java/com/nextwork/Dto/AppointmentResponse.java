package com.nextwork.Dto;

import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AppointmentResponse {

    private Long idCita;
    private Long idAlumno;
    private String nombreAlumno;
    private Long idMaestro;
    private String nombreMaestro;
    private Long idSlot;
    private LocalDateTime horaInicio;
    private LocalDateTime horaFin;
    private Integer duracion;
    private Modalidad modalidad;
    private EstadoCita estado;
    private String descripcionClase;
    private String ubicacion;
    private String linkMeet;
    private String codigoQr;
    private LocalDateTime fechaCreacion;
}
