package com.nextwork.Controller;

import com.nextwork.Dto.ChangePasswordRequest;
import com.nextwork.Dto.ForgotPasswordRequest;
import com.nextwork.Dto.LoginRequest;
import com.nextwork.Dto.LoginResponse;
import com.nextwork.Dto.RegisterAlumnoRequest;
import com.nextwork.Dto.ResetPasswordRequest;
import com.nextwork.Service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /auth/login
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // POST /auth/register/alumno
    @PostMapping("/register/alumno")
    public ResponseEntity<LoginResponse> registrarAlumno(@Valid @RequestBody RegisterAlumnoRequest request) {
        LoginResponse response = authService.registrarAlumno(request);
        return ResponseEntity.ok(response);
    }

    // PUT /auth/change-password
    @PutMapping("/change-password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.cambiarPassword(request);
        return ResponseEntity.noContent().build();
    }

    // POST /auth/forgot-password — siempre responde 200 (no revela si el correo existe)
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.solicitarRecuperacion(request.getCorreo());
        return ResponseEntity.ok().build();
    }

    // POST /auth/reset-password
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetearPassword(request.getToken(), request.getNuevaPassword());
        return ResponseEntity.noContent().build();
    }
}
