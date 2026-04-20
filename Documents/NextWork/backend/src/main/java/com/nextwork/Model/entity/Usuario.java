package com.nextwork.Model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "nombres", nullable = false, length = 50)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 50)
    private String apellidos;

    @Column(name = "correo", nullable = false, unique = true, length = 100)
    private String correo;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "telefono_emergencia", length = 20)
    private String telefonoEmergencia;

    @Column(name = "parentesco", length = 50)
    private String parentesco;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_rol", nullable = false)
    private Rol rol;

    @Column(name = "activo")
    private Boolean activo = true;

    @Column(name = "intentos_fallidos")
    private Integer intentosFallidos = 0;

    @Column(name = "must_change_password")
    private Boolean mustChangePassword = false;

    @CreationTimestamp
    @Column(name = "registro_fecha", updatable = false)
    private LocalDateTime registroFecha;
}
