package com.nextwork.backend;

import com.nextwork.Dto.AppointmentRequest;
import com.nextwork.Dto.AppointmentResponse;
import com.nextwork.Dto.RescheduleRequest;
import com.nextwork.Dto.SlotDTO;
import com.nextwork.Excepcion.BusinessException;
import com.nextwork.Excepcion.ResourceNotFoundException;
import com.nextwork.Model.entity.Cita;
import com.nextwork.Model.entity.Rol;
import com.nextwork.Model.entity.Slot;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import com.nextwork.Service.AppointmentService;
import com.nextwork.Service.GoogleCalendarService;
import com.nextwork.Service.Repository.CitaRepository;
import com.nextwork.Service.Repository.RolRepository;
import com.nextwork.Service.Repository.SlotRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import com.nextwork.Utilities.QrUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestConfig.class)
@Transactional
class AppointmentServiceTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private QrUtil qrUtil;

    private Rol rolAlumno;
    private Rol rolMaestro;
    private Usuario alumno;
    private Usuario maestro;

    @BeforeEach
    void setUp() {
        // Clean up database
        citaRepository.deleteAll();
        slotRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        // Create roles
        rolAlumno = new Rol();
        rolAlumno.setNombreRol("ROLE_ALUMNO");
        rolAlumno = rolRepository.save(rolAlumno);

        rolMaestro = new Rol();
        rolMaestro.setNombreRol("ROLE_MAESTRO");
        rolMaestro = rolRepository.save(rolMaestro);

        // Create test users
        alumno = crearUsuario("alumno@test.com", "Alumno Test", "Test", rolAlumno);
        maestro = crearUsuario("maestro@test.com", "Maestro Test", "Test", rolMaestro);

        // Mock external services
        when(googleCalendarService.crearEventoMeet(
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            anyString(),
            anyString(),
            anyString(),
            anyString(),
            anyString()
        )).thenReturn("https://meet.google.com/test-meeting");

        when(qrUtil.generarQrBase64(anyString())).thenReturn("base64-qr-code-data");
    }

    // ─────────────────────────────────────────────
    // OBTENER SLOTS DISPONIBLES TESTS
    // ─────────────────────────────────────────────

    @Test
    void obtenerSlotsDisponibles_MaestroConSlotsDisponibles_RetornaLista() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot1 = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);
        Slot slot2 = crearSlot(maestro, fecha, LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.PRESENCIAL, true);

        // Act
        List<SlotDTO> slots = appointmentService.obtenerSlotsDisponibles(maestro.getIdUsuario(), fecha);

        // Assert
        assertEquals(2, slots.size());
        assertTrue(slots.stream().allMatch(SlotDTO::getDisponible));
    }

    @Test
    void obtenerSlotsDisponibles_SoloRetornaSlotsDisponibles_NoRetornaOcupados() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);
        crearSlot(maestro, fecha, LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.VIRTUAL, false); // Ocupado

        // Act
        List<SlotDTO> slots = appointmentService.obtenerSlotsDisponibles(maestro.getIdUsuario(), fecha);

        // Assert
        assertEquals(1, slots.size());
        assertTrue(slots.get(0).getDisponible());
    }

    @Test
    void obtenerSlotsDisponibles_MaestroNoExiste_LanzaResourceNotFoundException() {
        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            appointmentService.obtenerSlotsDisponibles(999L, LocalDate.now());
        });
    }

    // ─────────────────────────────────────────────
    // RESERVAR CITA TESTS
    // ─────────────────────────────────────────────

    @Test
    void reservarCita_DatosValidos_CreaCitaVirtual() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdAlumno(alumno.getIdUsuario());
        request.setIdMaestro(maestro.getIdUsuario());
        request.setIdSlot(slot.getIdSlot());
        request.setDuracion(60);
        request.setModalidad(Modalidad.VIRTUAL);
        request.setDescripcionClase("Clase de matemáticas");

        // Act
        AppointmentResponse response = appointmentService.reservarCita(request);

        // Assert
        assertNotNull(response);
        assertEquals(EstadoCita.Agendada, response.getEstado());
        assertEquals(Modalidad.VIRTUAL, response.getModalidad());
        assertEquals("https://meet.google.com/test-meeting", response.getLinkMeet());
        assertNull(response.getCodigoQr());

        // Verify slot is now unavailable
        Slot slotActualizado = slotRepository.findById(slot.getIdSlot()).get();
        assertFalse(slotActualizado.getDisponible());

        // Verify Google Calendar was called
        verify(googleCalendarService, times(1)).crearEventoMeet(
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            anyString(),
            anyString(),
            anyString(),
            anyString(),
            anyString()
        );
    }

    @Test
    void reservarCita_DatosValidos_CreaCitaPresencial() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.PRESENCIAL, true);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdAlumno(alumno.getIdUsuario());
        request.setIdMaestro(maestro.getIdUsuario());
        request.setIdSlot(slot.getIdSlot());
        request.setDuracion(40);
        request.setModalidad(Modalidad.PRESENCIAL);
        request.setDescripcionClase("Clase de inglés");
        request.setUbicacion("Sala 101, Edificio A");

        // Act
        AppointmentResponse response = appointmentService.reservarCita(request);

        // Assert
        assertNotNull(response);
        assertEquals(EstadoCita.Agendada, response.getEstado());
        assertEquals(Modalidad.PRESENCIAL, response.getModalidad());
        assertNull(response.getLinkMeet());
        assertEquals("base64-qr-code-data", response.getCodigoQr());

        // Verify QR was generated
        verify(qrUtil, times(1)).generarQrBase64(anyString());
    }

    @Test
    void reservarCita_DuracionInvalida_LanzaBusinessException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdAlumno(alumno.getIdUsuario());
        request.setIdMaestro(maestro.getIdUsuario());
        request.setIdSlot(slot.getIdSlot());
        request.setDuracion(30); // Invalid duration
        request.setModalidad(Modalidad.VIRTUAL);
        request.setDescripcionClase("Clase de matemáticas");

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.reservarCita(request);
        });

        assertTrue(exception.getMessage().contains("40 o 60 minutos"));
    }

    @Test
    void reservarCita_AlumnoNoExiste_LanzaResourceNotFoundException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdAlumno(999L);
        request.setIdMaestro(maestro.getIdUsuario());
        request.setIdSlot(slot.getIdSlot());
        request.setDuracion(60);
        request.setModalidad(Modalidad.VIRTUAL);
        request.setDescripcionClase("Test");

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            appointmentService.reservarCita(request);
        });
    }

    @Test
    void reservarCita_SlotNoDisponible_LanzaBusinessException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdAlumno(alumno.getIdUsuario());
        request.setIdMaestro(maestro.getIdUsuario());
        request.setIdSlot(slot.getIdSlot());
        request.setDuracion(60);
        request.setModalidad(Modalidad.VIRTUAL);
        request.setDescripcionClase("Test");

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.reservarCita(request);
        });

        assertTrue(exception.getMessage().contains("no está disponible"));
    }

    @Test
    void reservarCita_SlotYaReservado_LanzaBusinessException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);
        
        // Create existing appointment
        Cita citaExistente = new Cita();
        citaExistente.setAlumno(alumno);
        citaExistente.setMaestro(maestro);
        citaExistente.setSlot(slot);
        citaExistente.setHoraInicio(LocalDateTime.of(fecha, LocalTime.of(9, 0)));
        citaExistente.setHoraFin(LocalDateTime.of(fecha, LocalTime.of(10, 0)));
        citaExistente.setDuracion(60);
        citaExistente.setModalidad(Modalidad.VIRTUAL);
        citaExistente.setEstado(EstadoCita.Agendada);
        citaRepository.save(citaExistente);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdAlumno(alumno.getIdUsuario());
        request.setIdMaestro(maestro.getIdUsuario());
        request.setIdSlot(slot.getIdSlot());
        request.setDuracion(60);
        request.setModalidad(Modalidad.VIRTUAL);
        request.setDescripcionClase("Test");

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.reservarCita(request);
        });

        assertTrue(exception.getMessage().contains("ya fue reservado"));
    }

    // ─────────────────────────────────────────────
    // CANCELAR CITA TESTS
    // ─────────────────────────────────────────────

    @Test
    void cancelarCita_CitaFutura_CancelaYLiberaSlot() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(3);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Cita cita = crearCita(alumno, maestro, slot, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);

        // Act
        appointmentService.cancelarCita(cita.getIdCita());

        // Assert
        Cita citaActualizada = citaRepository.findById(cita.getIdCita()).get();
        assertEquals(EstadoCita.Cancelada, citaActualizada.getEstado());

        Slot slotActualizado = slotRepository.findById(slot.getIdSlot()).get();
        assertTrue(slotActualizado.getDisponible());
    }

    @Test
    void cancelarCita_MenosDe24Horas_LanzaBusinessException() {
        // Arrange
        LocalDateTime horaInicio = LocalDateTime.now().plusHours(20); // Less than 24 hours
        Slot slot = crearSlot(maestro, horaInicio.toLocalDate(), horaInicio.toLocalTime(), 
                             horaInicio.toLocalTime().plusMinutes(60), Modalidad.VIRTUAL, false);
        Cita cita = crearCita(alumno, maestro, slot, horaInicio, 60);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.cancelarCita(cita.getIdCita());
        });

        assertTrue(exception.getMessage().contains("24 horas"));
    }

    @Test
    void cancelarCita_CitaYaCancelada_LanzaBusinessException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(3);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Cita cita = crearCita(alumno, maestro, slot, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);
        cita.setEstado(EstadoCita.Cancelada);
        citaRepository.save(cita);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.cancelarCita(cita.getIdCita());
        });

        assertTrue(exception.getMessage().contains("ya fue cancelada"));
    }

    @Test
    void cancelarCita_CitaCompletada_LanzaBusinessException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(3);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Cita cita = crearCita(alumno, maestro, slot, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);
        cita.setEstado(EstadoCita.Completada);
        citaRepository.save(cita);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.cancelarCita(cita.getIdCita());
        });

        assertTrue(exception.getMessage().contains("ya completada"));
    }

    @Test
    void cancelarCita_CitaNoExiste_LanzaResourceNotFoundException() {
        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            appointmentService.cancelarCita(999L);
        });
    }

    // ─────────────────────────────────────────────
    // REAGENDAR CITA TESTS
    // ─────────────────────────────────────────────

    @Test
    void reagendarCita_DatosValidos_ReagendaYActualizaSlots() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(3);
        Slot slotAnterior = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Slot slotNuevo = crearSlot(maestro, fecha, LocalTime.of(11, 0), LocalTime.of(12, 0), Modalidad.VIRTUAL, true);
        
        Cita cita = crearCita(alumno, maestro, slotAnterior, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);

        RescheduleRequest request = new RescheduleRequest();
        request.setIdSlotNuevo(slotNuevo.getIdSlot());

        // Act
        AppointmentResponse response = appointmentService.reagendarCita(cita.getIdCita(), request);

        // Assert
        assertEquals(EstadoCita.Reagendada, response.getEstado());
        
        Slot slotAnteriorActualizado = slotRepository.findById(slotAnterior.getIdSlot()).get();
        assertTrue(slotAnteriorActualizado.getDisponible());

        Slot slotNuevoActualizado = slotRepository.findById(slotNuevo.getIdSlot()).get();
        assertFalse(slotNuevoActualizado.getDisponible());
    }

    @Test
    void reagendarCita_MenosDe24Horas_LanzaBusinessException() {
        // Arrange
        LocalDateTime horaInicio = LocalDateTime.now().plusHours(20);
        Slot slotAnterior = crearSlot(maestro, horaInicio.toLocalDate(), horaInicio.toLocalTime(), 
                                     horaInicio.toLocalTime().plusMinutes(60), Modalidad.VIRTUAL, false);
        Slot slotNuevo = crearSlot(maestro, LocalDate.now().plusDays(3), LocalTime.of(11, 0), 
                                   LocalTime.of(12, 0), Modalidad.VIRTUAL, true);
        
        Cita cita = crearCita(alumno, maestro, slotAnterior, horaInicio, 60);

        RescheduleRequest request = new RescheduleRequest();
        request.setIdSlotNuevo(slotNuevo.getIdSlot());

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.reagendarCita(cita.getIdCita(), request);
        });

        assertTrue(exception.getMessage().contains("24 horas"));
    }

    @Test
    void reagendarCita_NuevoSlotNoDisponible_LanzaBusinessException() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(3);
        Slot slotAnterior = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Slot slotNuevo = crearSlot(maestro, fecha, LocalTime.of(11, 0), LocalTime.of(12, 0), Modalidad.VIRTUAL, false);
        
        Cita cita = crearCita(alumno, maestro, slotAnterior, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);

        RescheduleRequest request = new RescheduleRequest();
        request.setIdSlotNuevo(slotNuevo.getIdSlot());

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.reagendarCita(cita.getIdCita(), request);
        });

        assertTrue(exception.getMessage().contains("no está disponible"));
    }

    // ─────────────────────────────────────────────
    // HISTORIAL TESTS
    // ─────────────────────────────────────────────

    @Test
    void historialAlumno_AlumnoConCitas_RetornaListaCitas() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot1 = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Slot slot2 = crearSlot(maestro, fecha, LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.PRESENCIAL, false);
        
        crearCita(alumno, maestro, slot1, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);
        crearCita(alumno, maestro, slot2, LocalDateTime.of(fecha, LocalTime.of(10, 0)), 60);

        // Act
        List<AppointmentResponse> historial = appointmentService.historialAlumno(alumno.getIdUsuario());

        // Assert
        assertEquals(2, historial.size());
    }

    @Test
    void historialAlumno_AlumnoNoExiste_LanzaResourceNotFoundException() {
        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            appointmentService.historialAlumno(999L);
        });
    }

    @Test
    void historialMaestro_MaestroConCitas_RetornaListaCitas() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        crearCita(alumno, maestro, slot, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);

        // Act
        List<AppointmentResponse> historial = appointmentService.historialMaestro(
            maestro.getIdUsuario(), null, null, null, null
        );

        // Assert
        assertEquals(1, historial.size());
    }

    @Test
    void historialMaestro_FiltroEstado_RetornaSoloAgendadas() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot1 = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Slot slot2 = crearSlot(maestro, fecha, LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.VIRTUAL, false);
        
        Cita cita1 = crearCita(alumno, maestro, slot1, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);
        Cita cita2 = crearCita(alumno, maestro, slot2, LocalDateTime.of(fecha, LocalTime.of(10, 0)), 60);
        cita2.setEstado(EstadoCita.Cancelada);
        citaRepository.save(cita2);

        // Act
        List<AppointmentResponse> historial = appointmentService.historialMaestro(
            maestro.getIdUsuario(), null, null, EstadoCita.Agendada, null
        );

        // Assert
        assertEquals(1, historial.size());
        assertEquals(EstadoCita.Agendada, historial.get(0).getEstado());
    }

    @Test
    void historialMaestro_FiltroModalidad_RetornaSoloVirtual() {
        // Arrange
        LocalDate fecha = LocalDate.now().plusDays(2);
        Slot slot1 = crearSlot(maestro, fecha, LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);
        Slot slot2 = crearSlot(maestro, fecha, LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.PRESENCIAL, false);
        
        Cita cita1 = crearCita(alumno, maestro, slot1, LocalDateTime.of(fecha, LocalTime.of(9, 0)), 60);
        cita1.setModalidad(Modalidad.VIRTUAL);
        citaRepository.save(cita1);
        
        Cita cita2 = crearCita(alumno, maestro, slot2, LocalDateTime.of(fecha, LocalTime.of(10, 0)), 60);
        cita2.setModalidad(Modalidad.PRESENCIAL);
        citaRepository.save(cita2);

        // Act
        List<AppointmentResponse> historial = appointmentService.historialMaestro(
            maestro.getIdUsuario(), null, null, null, Modalidad.VIRTUAL
        );

        // Assert
        assertEquals(1, historial.size());
        assertEquals(Modalidad.VIRTUAL, historial.get(0).getModalidad());
    }

    // ─────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────

    private Usuario crearUsuario(String correo, String nombres, String apellidos, Rol rol) {
        Usuario usuario = new Usuario();
        usuario.setNombres(nombres);
        usuario.setApellidos(apellidos);
        usuario.setCorreo(correo);
        usuario.setPassword(passwordEncoder.encode("password123"));
        usuario.setTelefono("1234567890");
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setIntentosFallidos(0);
        usuario.setMustChangePassword(false);
        return usuarioRepository.save(usuario);
    }

    private Slot crearSlot(Usuario maestro, LocalDate fecha, LocalTime horaInicio, 
                          LocalTime horaFin, Modalidad modalidad, boolean disponible) {
        Slot slot = new Slot();
        slot.setMaestro(maestro);
        slot.setFecha(fecha);
        slot.setHoraInicio(horaInicio);
        slot.setHoraFin(horaFin);
        slot.setModalidad(modalidad);
        slot.setDisponible(disponible);
        return slotRepository.save(slot);
    }

    private Cita crearCita(Usuario alumno, Usuario maestro, Slot slot, 
                          LocalDateTime horaInicio, int duracion) {
        Cita cita = new Cita();
        cita.setAlumno(alumno);
        cita.setMaestro(maestro);
        cita.setSlot(slot);
        cita.setHoraInicio(horaInicio);
        cita.setHoraFin(horaInicio.plusMinutes(duracion));
        cita.setDuracion(duracion);
        cita.setModalidad(slot.getModalidad());
        cita.setEstado(EstadoCita.Agendada);
        cita.setDescripcionClase("Clase de prueba");
        return citaRepository.save(cita);
    }
}
