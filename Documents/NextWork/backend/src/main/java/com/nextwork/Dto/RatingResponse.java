package com.nextwork.Dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RatingResponse {
    private Long idCalificacion;
    private Long idCita;
    private Long idEvaluador;
    private Long idEvaluado;
    private Integer estrellas;
    private Boolean asistio;
    private String comentario;
    private LocalDateTime fechaCreacion;
}
