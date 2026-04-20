package com.nextwork.Dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RescheduleRequest {

    @NotNull(message = "El ID del nuevo slot es obligatorio")
    private Long idSlotNuevo;
}
