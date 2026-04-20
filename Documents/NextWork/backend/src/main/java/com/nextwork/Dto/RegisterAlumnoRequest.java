package com.nextwork.Dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterAlumnoRequest {

    @NotBlank(message = "Los nombres son obligatorios")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$", message = "Los nombres solo pueden contener letras y espacios")
    @Size(min = 2, max = 50, message = "Los nombres deben tener entre 2 y 50 caracteres")
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$", message = "Los apellidos solo pueden contener letras y espacios")
    @Size(min = 2, max = 50, message = "Los apellidos deben tener entre 2 y 50 caracteres")
    private String apellidos;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo debe tener un formato válido")
    @Size(max = 100, message = "El correo no puede tener más de 100 caracteres")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
    private String password;

    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^\\d{10}$", message = "El teléfono debe tener 10 dígitos")
    private String telefono;

    @NotBlank(message = "El teléfono de emergencia es obligatorio")
    @Pattern(regexp = "^\\d{10}$", message = "El teléfono de emergencia debe tener 10 dígitos")
    private String telefonoEmergencia;

    @NotBlank(message = "El parentesco es obligatorio")
    @Size(min = 2, max = 50, message = "El parentesco debe tener entre 2 y 50 caracteres")
    private String parentesco;
}
