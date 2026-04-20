package com.nextwork.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeacherRatingSummaryDTO {
    private Long idMaestro;
    private Double ratingPromedio;
    private Long ratingTotal;
}
