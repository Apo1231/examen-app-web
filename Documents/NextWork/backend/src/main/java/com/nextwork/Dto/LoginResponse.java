package com.nextwork.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {

    private Long id;
    private String nombres;
    private String apellidos;
    private String correo;
    private String telefono;
    private String rol;
    private Boolean mustChangePassword;
    private String token;
}
