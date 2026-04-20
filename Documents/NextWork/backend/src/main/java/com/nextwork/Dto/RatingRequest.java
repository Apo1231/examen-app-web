package com.nextwork.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RatingRequest {

    @NotNull(message = "La calificación es obligatoria")
    @Min(value = 1, message = "La calificación mínima es 1 estrella")
    @Max(value = 5, message = "La calificación máxima es 5 estrellas")
    private Integer estrellas;

    @NotNull(message = "Debes indicar si asistió a la clase")
    private Boolean asistio;

    @Size(max = 500, message = "El comentario no puede tener más de 500 caracteres")
    private String comentario;
}
