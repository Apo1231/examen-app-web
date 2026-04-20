package com.nextwork.Service;

import com.nextwork.Dto.ChangePasswordRequest;
import com.nextwork.Dto.LoginRequest;
import com.nextwork.Dto.LoginResponse;
import com.nextwork.Dto.RegisterAlumnoRequest;
import com.nextwork.Excepcion.AuthException;
import com.nextwork.Excepcion.BusinessException;
import com.nextwork.Excepcion.ResourceNotFoundException;
import com.nextwork.Model.entity.PasswordResetToken;
import com.nextwork.Model.entity.Rol;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Service.Repository.PasswordResetTokenRepository;
import com.nextwork.Service.Repository.RolRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import com.nextwork.Utilities.JwtUtil;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_INTENTOS = 3;
    private static final String ROL_ALUMNO = "ROLE_ALUMNO";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // ─────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────

    @Transactional(noRollbackFor = AuthException.class)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository
            .findByCorreo(request.getCorreo())
            .orElseThrow(() -> new AuthException("Credenciales incorrectas"));

        // Cuenta inactiva (bloqueada)
        if (!usuario.getActivo()) {
            throw new AuthException(
                "Cuenta bloqueada. Contacta al administrador."
            );
        }

        // Contraseña incorrecta
        if (
            !passwordEncoder.matches(
                request.getPassword(),
                usuario.getPassword()
            )
        ) {
            int intentos = usuario.getIntentosFallidos() + 1;
            usuario.setIntentosFallidos(intentos);

            // BR: bloquear tras 3 intentos fallidos
            if (intentos >= MAX_INTENTOS) {
                usuario.setActivo(false);
                usuarioRepository.save(usuario);
                throw new AuthException(
                    "Cuenta bloqueada por demasiados intentos fallidos. Contacta al administrador."
                );
            }

            usuarioRepository.save(usuario);
            throw new AuthException(
                "Credenciales incorrectas. Intentos restantes: " +
                    (MAX_INTENTOS - intentos)
            );
        }

        // Login exitoso — resetear intentos fallidos
        usuario.setIntentosFallidos(0);
        usuarioRepository.save(usuario);

        String token = jwtUtil.generarToken(
            usuario.getCorreo(),
            usuario.getRol().getNombreRol(),
            usuario.getIdUsuario()
        );

        return new LoginResponse(
            usuario.getIdUsuario(),
            usuario.getNombres(),
            usuario.getApellidos(),
            usuario.getCorreo(),
            usuario.getTelefono(),
            usuario.getRol().getNombreRol(),
            usuario.getMustChangePassword(),
            token
        );
    }

    // ─────────────────────────────────────────────
    // REGISTRO DE ALUMNO (público)
    // ─────────────────────────────────────────────

    @Transactional
    public LoginResponse registrarAlumno(RegisterAlumnoRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya está registrado.");
        }

        Rol rolAlumno = rolRepository
            .findByNombreRol(ROL_ALUMNO)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Rol ROLE_ALUMNO no encontrado en la base de datos."
                )
            );

        Usuario nuevo = new Usuario();
        nuevo.setNombres(request.getNombres());
        nuevo.setApellidos(request.getApellidos());
        nuevo.setCorreo(request.getCorreo());
        nuevo.setPassword(passwordEncoder.encode(request.getPassword()));
        nuevo.setTelefono(request.getTelefono());
        nuevo.setTelefonoEmergencia(request.getTelefonoEmergencia());
        nuevo.setParentesco(request.getParentesco());
        nuevo.setRol(rolAlumno);
        nuevo.setActivo(true);
        nuevo.setIntentosFallidos(0);
        nuevo.setMustChangePassword(false);

        Usuario guardado = usuarioRepository.save(nuevo);

        return new LoginResponse(
            guardado.getIdUsuario(),
            guardado.getNombres(),
            guardado.getApellidos(),
            guardado.getCorreo(),
            guardado.getTelefono(),
            guardado.getRol().getNombreRol(),
            guardado.getMustChangePassword(),
            null // sin token — el alumno debe hacer login tras registrarse
        );
    }

    // ─────────────────────────────────────────────
    // CAMBIO DE CONTRASEÑA (primer login de maestro o voluntario)
    // BR-03: maestros creados por admin deben cambiar contraseña
    // ─────────────────────────────────────────────

    @Transactional
    public void cambiarPassword(ChangePasswordRequest request) {
        Usuario usuario = usuarioRepository
            .findByCorreo(request.getCorreo())
            .orElseThrow(() ->
                new ResourceNotFoundException("Usuario no encontrado.")
            );

        if (
            !passwordEncoder.matches(
                request.getPasswordActual(),
                usuario.getPassword()
            )
        ) {
            throw new AuthException("La contraseña actual es incorrecta.");
        }

        if (request.getPasswordActual().equals(request.getPasswordNuevo())) {
            throw new BusinessException(
                "La nueva contraseña debe ser diferente a la actual."
            );
        }

        usuario.setPassword(passwordEncoder.encode(request.getPasswordNuevo()));
        usuario.setMustChangePassword(false);
        usuarioRepository.save(usuario);
    }

    // ─────────────────────────────────────────────
    // RECUPERACIÓN DE CONTRASEÑA — paso 1
    // Genera token y envía email; siempre responde 200 (seguridad)
    // ─────────────────────────────────────────────

    @Transactional
    public void solicitarRecuperacion(String correo) {
        // Si el correo no existe, no revelar información
        usuarioRepository
            .findByCorreo(correo)
            .ifPresent(usuario -> {
                // Eliminar tokens anteriores del mismo correo
                passwordResetTokenRepository.deleteByCorreo(correo);

                // Crear nuevo token con 30 min de vigencia
                String token = UUID.randomUUID().toString();
                LocalDateTime expiracion = LocalDateTime.now().plusMinutes(30);
                PasswordResetToken resetToken = new PasswordResetToken(
                    token,
                    correo,
                    expiracion
                );
                passwordResetTokenRepository.save(resetToken);

                // Construir link y enviar email
                String link = frontendUrl + "/reset-password?token=" + token;
                emailService.enviarEmailRecuperacion(
                    correo,
                    usuario.getNombres(),
                    link
                );
            });
    }

    // ─────────────────────────────────────────────
    // RECUPERACIÓN DE CONTRASEÑA — paso 2
    // Valida token y actualiza contraseña
    // ─────────────────────────────────────────────

    @Transactional
    public void resetearPassword(String token, String nuevaPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository
            .findByToken(token)
            .orElseThrow(() ->
                new BusinessException(
                    "El enlace de recuperación no es válido o ya fue utilizado."
                )
            );

        if (resetToken.getUsado()) {
            throw new BusinessException(
                "El enlace de recuperación ya fue utilizado."
            );
        }

        if (LocalDateTime.now().isAfter(resetToken.getExpiracion())) {
            throw new BusinessException(
                "El enlace de recuperación ha expirado. Solicita uno nuevo."
            );
        }

        Usuario usuario = usuarioRepository
            .findByCorreo(resetToken.getCorreo())
            .orElseThrow(() ->
                new ResourceNotFoundException("Usuario no encontrado.")
            );

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
