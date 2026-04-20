package com.nextwork.backend;

import com.nextwork.Dto.SlotDTO;
import com.nextwork.Dto.SlotRequest;
import com.nextwork.Excepcion.BusinessException;
import com.nextwork.Excepcion.ResourceNotFoundException;
import com.nextwork.Model.entity.Rol;
import com.nextwork.Model.entity.Slot;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Model.enums.Modalidad;
import com.nextwork.Service.SlotService;
import com.nextwork.Service.Repository.RolRepository;
import com.nextwork.Service.Repository.SlotRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SlotServiceTest {

    @Autowired
    private SlotService slotService;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Rol rolMaestro;
    private Rol rolAlumno;
    private Usuario maestro;

    @BeforeEach
    void setUp() {
        // Clean up database
        slotRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        // Create roles
        rolMaestro = new Rol();
        rolMaestro.setNombreRol("ROLE_MAESTRO");
        rolMaestro = rolRepository.save(rolMaestro);

        rolAlumno = new Rol();
        rolAlumno.setNombreRol("ROLE_ALUMNO");
        rolAlumno = rolRepository.save(rolAlumno);

        // Create test teacher
        maestro = crearUsuario("maestro@test.com", "Maestro", "Test", rolMaestro);
    }

    // ─────────────────────────────────────────────
    // CREAR SLOT TESTS
    // ─────────────────────────────────────────────

    @Test
    void crearSlot_DatosValidos_CreaSlot() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(LocalTime.of(9, 0));
        request.setHoraFin(LocalTime.of(10, 0));
        request.setModalidad(Modalidad.VIRTUAL);

        // Act
        SlotDTO result = slotService.crearSlot(maestro.getIdUsuario(), request);

        // Assert
        assertNotNull(result);
        assertEquals(maestro.getIdUsuario(), result.getIdMaestro());
        assertEquals(LocalDate.now().plusDays(2), result.getFecha());
        assertEquals(LocalTime.of(9, 0), result.getHoraInicio());
        assertEquals(LocalTime.of(10, 0), result.getHoraFin());
        assertEquals(Modalidad.VIRTUAL, result.getModalidad());
        assertTrue(result.getDisponible());

        // Verify in database
        List<Slot> slots = slotRepository.findByMaestroIdUsuario(maestro.getIdUsuario());
        assertEquals(1, slots.size());
    }

    @Test
    void crearSlot_MaestroNoExiste_LanzaResourceNotFoundException() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(LocalTime.of(9, 0));
        request.setHoraFin(LocalTime.of(10, 0));
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            slotService.crearSlot(999L, request);
        });
    }

    @Test
    void crearSlot_UsuarioNoEsMaestro_LanzaBusinessException() {
        // Arrange
        Usuario alumno = crearUsuario("alumno@test.com", "Alumno", "Test", rolAlumno);
        
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(LocalTime.of(9, 0));
        request.setHoraFin(LocalTime.of(10, 0));
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.crearSlot(alumno.getIdUsuario(), request);
        });

        assertTrue(exception.getMessage().contains("no tiene rol de maestro"));
    }

    @Test
    void crearSlot_FechaNula_LanzaBusinessException() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(null);
        request.setHoraInicio(LocalTime.of(9, 0));
        request.setHoraFin(LocalTime.of(10, 0));
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.crearSlot(maestro.getIdUsuario(), request);
        });

        assertTrue(exception.getMessage().contains("obligatorios"));
    }

    @Test
    void crearSlot_HoraInicioNula_LanzaBusinessException() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(null);
        request.setHoraFin(LocalTime.of(10, 0));
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.crearSlot(maestro.getIdUsuario(), request);
        });

        assertTrue(exception.getMessage().contains("obligatorios"));
    }

    @Test
    void crearSlot_HoraFinNula_LanzaBusinessException() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(LocalTime.of(9, 0));
        request.setHoraFin(null);
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.crearSlot(maestro.getIdUsuario(), request);
        });

        assertTrue(exception.getMessage().contains("obligatorios"));
    }

    @Test
    void crearSlot_HoraInicioNoAnteriorAHoraFin_LanzaBusinessException() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(LocalTime.of(10, 0));
        request.setHoraFin(LocalTime.of(9, 0)); // Fin antes de inicio
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.crearSlot(maestro.getIdUsuario(), request);
        });

        assertTrue(exception.getMessage().contains("anterior a la hora de fin"));
    }

    @Test
    void crearSlot_HorasIguales_LanzaBusinessException() {
        // Arrange
        SlotRequest request = new SlotRequest();
        request.setFecha(LocalDate.now().plusDays(2));
        request.setHoraInicio(LocalTime.of(9, 0));
        request.setHoraFin(LocalTime.of(9, 0)); // Misma hora
        request.setModalidad(Modalidad.VIRTUAL);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.crearSlot(maestro.getIdUsuario(), request);
        });

        assertTrue(exception.getMessage().contains("anterior a la hora de fin"));
    }

    // ─────────────────────────────────────────────
    // ELIMINAR SLOT TESTS
    // ─────────────────────────────────────────────

    @Test
    void eliminarSlot_SlotDisponible_EliminaSlot() {
        // Arrange
        Slot slot = crearSlot(maestro, LocalDate.now().plusDays(2), 
                             LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);

        // Act
        slotService.eliminarSlot(slot.getIdSlot(), maestro.getIdUsuario());

        // Assert
        assertFalse(slotRepository.findById(slot.getIdSlot()).isPresent());
    }

    @Test
    void eliminarSlot_SlotNoExiste_LanzaResourceNotFoundException() {
        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            slotService.eliminarSlot(999L, maestro.getIdUsuario());
        });
    }

    @Test
    void eliminarSlot_SlotNoPerteneceMaestro_LanzaBusinessException() {
        // Arrange
        Usuario otroMaestro = crearUsuario("otro@test.com", "Otro", "Maestro", rolMaestro);
        Slot slot = crearSlot(otroMaestro, LocalDate.now().plusDays(2),
                             LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.eliminarSlot(slot.getIdSlot(), maestro.getIdUsuario());
        });

        assertTrue(exception.getMessage().contains("No tienes permiso"));
    }

    @Test
    void eliminarSlot_SlotNoDisponible_LanzaBusinessException() {
        // Arrange
        Slot slot = crearSlot(maestro, LocalDate.now().plusDays(2),
                             LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, false);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            slotService.eliminarSlot(slot.getIdSlot(), maestro.getIdUsuario());
        });

        assertTrue(exception.getMessage().contains("ya fue reservado"));
    }

    // ─────────────────────────────────────────────
    // OBTENER SLOTS DEL MAESTRO TESTS
    // ─────────────────────────────────────────────

    @Test
    void obtenerSlotsDelMaestro_MaestroConSlots_RetornaLista() {
        // Arrange
        crearSlot(maestro, LocalDate.now().plusDays(2),
                 LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);
        crearSlot(maestro, LocalDate.now().plusDays(2),
                 LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.PRESENCIAL, true);
        crearSlot(maestro, LocalDate.now().plusDays(3),
                 LocalTime.of(14, 0), LocalTime.of(15, 0), Modalidad.VIRTUAL, false);

        // Act
        List<SlotDTO> slots = slotService.obtenerSlotsDelMaestro(maestro.getIdUsuario());

        // Assert
        assertEquals(3, slots.size());
        assertTrue(slots.stream().allMatch(s -> s.getIdMaestro().equals(maestro.getIdUsuario())));
    }

    @Test
    void obtenerSlotsDelMaestro_MaestroSinSlots_RetornaListaVacia() {
        // Act
        List<SlotDTO> slots = slotService.obtenerSlotsDelMaestro(maestro.getIdUsuario());

        // Assert
        assertEquals(0, slots.size());
    }

    @Test
    void obtenerSlotsDelMaestro_RetornaSoloSlotsDelMaestro_NoDeOtros() {
        // Arrange
        Usuario otroMaestro = crearUsuario("otro@test.com", "Otro", "Maestro", rolMaestro);
        
        crearSlot(maestro, LocalDate.now().plusDays(2),
                 LocalTime.of(9, 0), LocalTime.of(10, 0), Modalidad.VIRTUAL, true);
        crearSlot(otroMaestro, LocalDate.now().plusDays(2),
                 LocalTime.of(10, 0), LocalTime.of(11, 0), Modalidad.VIRTUAL, true);

        // Act
        List<SlotDTO> slots = slotService.obtenerSlotsDelMaestro(maestro.getIdUsuario());

        // Assert
        assertEquals(1, slots.size());
        assertEquals(maestro.getIdUsuario(), slots.get(0).getIdMaestro());
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
}
