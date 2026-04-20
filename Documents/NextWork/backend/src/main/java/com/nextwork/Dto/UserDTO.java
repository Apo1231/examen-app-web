package com.nextwork.Dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserDTO {

    private Long idUsuario;
    private String nombres;
    private String apellidos;
    private String correo;
    private String telefono;
    private String telefonoEmergencia;
    private String parentesco;
    private String rol;
    private Boolean activo;
    private LocalDateTime fechaRegistro;
    private Double ratingPromedio;
    private Long ratingTotal;

    public UserDTO(
        Long idUsuario,
        String nombres,
        String apellidos,
        String correo,
        String telefono,
        String telefonoEmergencia,
        String parentesco,
        String rol,
        Boolean activo,
        LocalDateTime fechaRegistro
    ) {
        this.idUsuario = idUsuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.correo = correo;
        this.telefono = telefono;
        this.telefonoEmergencia = telefonoEmergencia;
        this.parentesco = parentesco;
        this.rol = rol;
        this.activo = activo;
        this.fechaRegistro = fechaRegistro;
        this.ratingPromedio = 0.0;
        this.ratingTotal = 0L;
    }
}
