package com.nextwork.Model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false, length = 100)
    private String correo;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    @Column(nullable = false)
    private Boolean usado = false;

    public PasswordResetToken(String token, String correo, LocalDateTime expiracion) {
        this.token = token;
        this.correo = correo;
        this.expiracion = expiracion;
        this.usado = false;
    }
}
