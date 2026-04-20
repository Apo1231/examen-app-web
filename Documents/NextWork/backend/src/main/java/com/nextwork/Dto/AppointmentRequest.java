package com.nextwork.Dto;

import com.nextwork.Model.enums.Modalidad;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AppointmentRequest {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long idAlumno;

    @NotNull(message = "El ID del maestro es obligatorio")
    private Long idMaestro;

    @NotNull(message = "El ID del slot es obligatorio")
    private Long idSlot;

    @NotNull(message = "La duración es obligatoria")
    @Min(value = 40, message = "La duración mínima es 40 minutos")
    @Max(value = 60, message = "La duración máxima es 60 minutos")
    private Integer duracion;        // 40 o 60 minutos

    @NotNull(message = "La modalidad es obligatoria")
    private Modalidad modalidad;

    @NotBlank(message = "La descripción de la clase es obligatoria")
    @Size(max = 500, message = "La descripción no puede tener más de 500 caracteres")
    private String descripcionClase;

    // Campo condicional: obligatorio solo si modalidad es PRESENCIAL
    @Size(max = 200, message = "La ubicación no puede tener más de 200 caracteres")
    private String ubicacion;
}
