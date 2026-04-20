package com.nextwork.Dto;

import com.nextwork.Model.enums.Modalidad;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SlotRequest {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime horaInicio;

    @NotNull(message = "La hora de fin es obligatoria")
    private LocalTime horaFin;

    @NotNull(message = "La modalidad es obligatoria")
    private Modalidad modalidad;

    @Size(max = 200, message = "La ubicación no puede tener más de 200 caracteres")
    private String ubicacion;
}
