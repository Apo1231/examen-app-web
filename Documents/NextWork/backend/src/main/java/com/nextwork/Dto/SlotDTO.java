package com.nextwork.Dto;

import com.nextwork.Model.enums.Modalidad;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class SlotDTO {

    private Long idSlot;
    private Long idMaestro;
    private String nombreMaestro;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private Boolean disponible;
    private Modalidad modalidad;
    private String ubicacion;
}
