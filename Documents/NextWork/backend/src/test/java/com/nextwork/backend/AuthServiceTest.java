package com.nextwork.backend;

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
import com.nextwork.Service.AuthService;
import com.nextwork.Service.EmailService;
import com.nextwork.Service.Repository.PasswordResetTokenRepository;
import com.nextwork.Service.Repository.RolRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import com.nextwork.Utilities.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import org.mockito.Mockito;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestConfig.class)
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    private Rol rolAlumno;
    private Rol rolMaestro;

    @BeforeEach
    void setUp() {
        // Clean up database
        passwordResetTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        // Create roles
        rolAlumno = new Rol();
        rolAlumno.setNombreRol("ROLE_ALUMNO");
        rolAlumno = rolRepository.save(rolAlumno);

        rolMaestro = new Rol();
        rolMaestro.setNombreRol("ROLE_MAESTRO");
        rolMaestro = rolRepository.save(rolMaestro);

        // Reset mock email service
        Mockito.reset(emailService);
        // Mock email service to avoid actual email sending
        doNothing().when(emailService).enviarEmailRecuperacion(anyString(), anyString(), anyString());
    }

    // ─────────────────────────────────────────────
    // LOGIN TESTS
    // ─────────────────────────────────────────────

    @Test
    void login_UsuarioExistente_CredencialesCorrectas_RetornaToken() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        LoginRequest request = new LoginRequest();
        request.setCorreo("test@test.com");
        request.setPassword("password123");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("test@test.com", response.getCorreo());
        assertEquals("ROLE_ALUMNO", response.getRol());
        assertEquals(0, usuarioRepository.findByCorreo("test@test.com").get().getIntentosFallidos());
    }

    @Test
    void login_CredencialesIncorrectas_IncrementaIntentosYLanzaExcepcion() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        LoginRequest request = new LoginRequest();
        request.setCorreo("test@test.com");
        request.setPassword("wrongpassword");

        // Act & Assert
        AuthException exception = assertThrows(AuthException.class, () -> {
            authService.login(request);
        });

        assertTrue(exception.getMessage().contains("Credenciales incorrectas"));
        assertTrue(exception.getMessage().contains("Intentos restantes: 2"));
        assertEquals(1, usuarioRepository.findByCorreo("test@test.com").get().getIntentosFallidos());
    }

    @Test
    void login_TresIntentosFallidos_BloqueaCuenta() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        usuario.setIntentosFallidos(2); // Ya tiene 2 intentos
        usuarioRepository.save(usuario);

        LoginRequest request = new LoginRequest();
        request.setCorreo("test@test.com");
        request.setPassword("wrongpassword");

        // Act & Assert
        AuthException exception = assertThrows(AuthException.class, () -> {
            authService.login(request);
        });

        assertTrue(exception.getMessage().contains("Cuenta bloqueada"));
        Usuario usuarioActualizado = usuarioRepository.findByCorreo("test@test.com").get();
        assertFalse(usuarioActualizado.getActivo());
        assertEquals(3, usuarioActualizado.getIntentosFallidos());
    }

    @Test
    void login_CuentaBloqueada_LanzaExcepcion() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", false);
        LoginRequest request = new LoginRequest();
        request.setCorreo("test@test.com");
        request.setPassword("password123");

        // Act & Assert
        AuthException exception = assertThrows(AuthException.class, () -> {
            authService.login(request);
        });

        assertTrue(exception.getMessage().contains("Cuenta bloqueada"));
    }

    @Test
    void login_UsuarioNoExiste_LanzaExcepcion() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setCorreo("noexiste@test.com");
        request.setPassword("password123");

        // Act & Assert
        AuthException exception = assertThrows(AuthException.class, () -> {
            authService.login(request);
        });

        assertEquals("Credenciales incorrectas", exception.getMessage());
    }

    @Test
    void login_LoginExitoso_ResetaIntentosFallidos() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        usuario.setIntentosFallidos(2);
        usuarioRepository.save(usuario);

        LoginRequest request = new LoginRequest();
        request.setCorreo("test@test.com");
        request.setPassword("password123");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response.getToken());
        assertEquals(0, usuarioRepository.findByCorreo("test@test.com").get().getIntentosFallidos());
    }

    // ─────────────────────────────────────────────
    // REGISTRO DE ALUMNO TESTS
    // ─────────────────────────────────────────────

    @Test
    void registrarAlumno_DatosValidos_CreaUsuarioYRetornaLoginResponse() {
        // Arrange
        RegisterAlumnoRequest request = new RegisterAlumnoRequest();
        request.setNombres("Juan");
        request.setApellidos("Pérez");
        request.setCorreo("juan@test.com");
        request.setPassword("password123");
        request.setTelefono("1234567890");
        request.setTelefonoEmergencia("0987654321");
        request.setParentesco("Padre");

        // Act
        LoginResponse response = authService.registrarAlumno(request);

        // Assert
        assertNotNull(response);
        assertEquals("Juan", response.getNombres());
        assertEquals("Pérez", response.getApellidos());
        assertEquals("juan@test.com", response.getCorreo());
        assertEquals("ROLE_ALUMNO", response.getRol());
        assertNull(response.getToken()); // Sin token en registro
        assertFalse(response.getMustChangePassword());

        // Verify in database
        Usuario usuarioGuardado = usuarioRepository.findByCorreo("juan@test.com").get();
        assertTrue(usuarioGuardado.getActivo());
        assertEquals(0, usuarioGuardado.getIntentosFallidos());
        assertTrue(passwordEncoder.matches("password123", usuarioGuardado.getPassword()));
    }

    @Test
    void registrarAlumno_CorreoYaExiste_LanzaBusinessException() {
        // Arrange
        crearUsuarioAlumno("existente@test.com", "password123", true);

        RegisterAlumnoRequest request = new RegisterAlumnoRequest();
        request.setCorreo("existente@test.com");
        request.setNombres("Test");
        request.setApellidos("User");
        request.setPassword("password123");
        request.setTelefono("1234567890");
        request.setTelefonoEmergencia("0987654321");
        request.setParentesco("Padre");

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            authService.registrarAlumno(request);
        });

        assertEquals("El correo ya está registrado.", exception.getMessage());
    }

    // ─────────────────────────────────────────────
    // CAMBIO DE CONTRASEÑA TESTS
    // ─────────────────────────────────────────────

    @Test
    void cambiarPassword_DatosValidos_ActualizaPassword() {
        // Arrange
        Usuario usuario = crearUsuarioMaestro("maestro@test.com", "oldpassword", true);
        usuario.setMustChangePassword(true);
        usuarioRepository.save(usuario);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCorreo("maestro@test.com");
        request.setPasswordActual("oldpassword");
        request.setPasswordNuevo("newpassword123");

        // Act
        authService.cambiarPassword(request);

        // Assert
        Usuario usuarioActualizado = usuarioRepository.findByCorreo("maestro@test.com").get();
        assertTrue(passwordEncoder.matches("newpassword123", usuarioActualizado.getPassword()));
        assertFalse(usuarioActualizado.getMustChangePassword());
    }

    @Test
    void cambiarPassword_PasswordActualIncorrecto_LanzaAuthException() {
        // Arrange
        Usuario usuario = crearUsuarioMaestro("maestro@test.com", "oldpassword", true);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCorreo("maestro@test.com");
        request.setPasswordActual("wrongpassword");
        request.setPasswordNuevo("newpassword123");

        // Act & Assert
        AuthException exception = assertThrows(AuthException.class, () -> {
            authService.cambiarPassword(request);
        });

        assertEquals("La contraseña actual es incorrecta.", exception.getMessage());
    }

    @Test
    void cambiarPassword_NuevoPasswordIgualAlActual_LanzaBusinessException() {
        // Arrange
        Usuario usuario = crearUsuarioMaestro("maestro@test.com", "password123", true);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCorreo("maestro@test.com");
        request.setPasswordActual("password123");
        request.setPasswordNuevo("password123");

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            authService.cambiarPassword(request);
        });

        assertEquals("La nueva contraseña debe ser diferente a la actual.", exception.getMessage());
    }

    @Test
    void cambiarPassword_UsuarioNoExiste_LanzaResourceNotFoundException() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCorreo("noexiste@test.com");
        request.setPasswordActual("oldpassword");
        request.setPasswordNuevo("newpassword123");

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            authService.cambiarPassword(request);
        });
    }

    // ─────────────────────────────────────────────
    // RECUPERACIÓN DE CONTRASEÑA TESTS
    // ─────────────────────────────────────────────

    @Test
    void solicitarRecuperacion_CorreoExistente_CreaTokenYEnviaEmail() {
        // Arrange
        crearUsuarioAlumno("test@test.com", "password123", true);

        // Act
        authService.solicitarRecuperacion("test@test.com");

        // Assert
        verify(emailService, times(1)).enviarEmailRecuperacion(
            eq("test@test.com"),
            anyString(),
            anyString()
        );

        // Verify token was created
        var tokens = passwordResetTokenRepository.findAll();
        assertEquals(1, tokens.size());
        assertEquals("test@test.com", tokens.get(0).getCorreo());
        assertFalse(tokens.get(0).getUsado());
    }

    @Test
    void solicitarRecuperacion_CorreoNoExistente_NoHaceNada() {
        // Act
        authService.solicitarRecuperacion("noexiste@test.com");

        // Assert
        verify(emailService, never()).enviarEmailRecuperacion(anyString(), anyString(), anyString());
        assertEquals(0, passwordResetTokenRepository.findAll().size());
    }

    @Test
    void solicitarRecuperacion_TokenAnterior_SeElimina() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        
        // Create old token
        PasswordResetToken oldToken = new PasswordResetToken(
            "old-token",
            "test@test.com",
            LocalDateTime.now().plusMinutes(30)
        );
        passwordResetTokenRepository.save(oldToken);

        // Act
        authService.solicitarRecuperacion("test@test.com");

        // Assert
        var tokens = passwordResetTokenRepository.findAll();
        assertEquals(1, tokens.size());
        assertNotEquals("old-token", tokens.get(0).getToken());
    }

    @Test
    void resetearPassword_TokenValido_ActualizaPassword() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "oldpassword", true);
        
        String token = "valid-token";
        PasswordResetToken resetToken = new PasswordResetToken(
            token,
            "test@test.com",
            LocalDateTime.now().plusMinutes(30)
        );
        passwordResetTokenRepository.save(resetToken);

        // Act
        authService.resetearPassword(token, "newpassword123");

        // Assert
        Usuario usuarioActualizado = usuarioRepository.findByCorreo("test@test.com").get();
        assertTrue(passwordEncoder.matches("newpassword123", usuarioActualizado.getPassword()));

        PasswordResetToken tokenActualizado = passwordResetTokenRepository.findByToken(token).get();
        assertTrue(tokenActualizado.getUsado());
    }

    @Test
    void resetearPassword_TokenNoExiste_LanzaBusinessException() {
        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            authService.resetearPassword("invalid-token", "newpassword123");
        });

        assertTrue(exception.getMessage().contains("no es válido"));
    }

    @Test
    void resetearPassword_TokenYaUsado_LanzaBusinessException() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        
        String token = "used-token";
        PasswordResetToken resetToken = new PasswordResetToken(
            token,
            "test@test.com",
            LocalDateTime.now().plusMinutes(30)
        );
        resetToken.setUsado(true);
        passwordResetTokenRepository.save(resetToken);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            authService.resetearPassword(token, "newpassword123");
        });

        assertEquals("El enlace de recuperación ya fue utilizado.", exception.getMessage());
    }

    @Test
    void resetearPassword_TokenExpirado_LanzaBusinessException() {
        // Arrange
        Usuario usuario = crearUsuarioAlumno("test@test.com", "password123", true);
        
        String token = "expired-token";
        PasswordResetToken resetToken = new PasswordResetToken(
            token,
            "test@test.com",
            LocalDateTime.now().minusMinutes(1) // Expired 1 minute ago
        );
        passwordResetTokenRepository.save(resetToken);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            authService.resetearPassword(token, "newpassword123");
        });

        assertTrue(exception.getMessage().contains("ha expirado"));
    }

    // ─────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────

    private Usuario crearUsuarioAlumno(String correo, String password, boolean activo) {
        Usuario usuario = new Usuario();
        usuario.setNombres("Test");
        usuario.setApellidos("User");
        usuario.setCorreo(correo);
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setTelefono("1234567890");
        usuario.setTelefonoEmergencia("0987654321");
        usuario.setParentesco("Padre");
        usuario.setRol(rolAlumno);
        usuario.setActivo(activo);
        usuario.setIntentosFallidos(0);
        usuario.setMustChangePassword(false);
        return usuarioRepository.save(usuario);
    }

    private Usuario crearUsuarioMaestro(String correo, String password, boolean activo) {
        Usuario usuario = new Usuario();
        usuario.setNombres("Maestro");
        usuario.setApellidos("Test");
        usuario.setCorreo(correo);
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setTelefono("1234567890");
        usuario.setRol(rolMaestro);
        usuario.setActivo(activo);
        usuario.setIntentosFallidos(0);
        usuario.setMustChangePassword(true);
        return usuarioRepository.save(usuario);
    }
}
