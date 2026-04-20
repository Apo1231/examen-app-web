package com.nextwork.Service;

import com.nextwork.Dto.AppointmentRequest;
import com.nextwork.Dto.AppointmentResponse;
import com.nextwork.Dto.RatingRequest;
import com.nextwork.Dto.RatingResponse;
import com.nextwork.Dto.RescheduleRequest;
import com.nextwork.Dto.SlotDTO;
import com.nextwork.Excepcion.BusinessException;
import com.nextwork.Excepcion.ResourceNotFoundException;
import com.nextwork.Model.entity.CalificacionCita;
import com.nextwork.Model.entity.Cita;
import com.nextwork.Model.entity.Slot;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import com.nextwork.Service.Repository.CalificacionCitaRepository;
import com.nextwork.Service.Repository.CitaRepository;
import com.nextwork.Service.Repository.SlotRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import com.nextwork.Utilities.QrUtil;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final int HORAS_MINIMAS_CANCELACION = 24;

    private final CitaRepository citaRepository;
    private final SlotRepository slotRepository;
    private final UsuarioRepository usuarioRepository;
    private final CalificacionCitaRepository calificacionCitaRepository;
    private final QrUtil qrUtil;
    private final GoogleCalendarService googleCalendarService;
    private final EmailService emailService;

    // ─────────────────────────────────────────────
    // VER SLOTS DISPONIBLES DE UN MAESTRO EN UNA FECHA
    // ─────────────────────────────────────────────

    public List<SlotDTO> obtenerSlotsDisponibles(
        Long idMaestro,
        LocalDate fecha
    ) {
        usuarioRepository
            .findById(idMaestro)
            .orElseThrow(() ->
                new ResourceNotFoundException("Maestro no encontrado.")
            );

        return slotRepository
            .findByMaestroIdUsuarioAndFechaAndDisponibleTrue(idMaestro, fecha)
            .stream()
            .map(this::mapearSlot)
            .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // RESERVAR CITA (BR-01: no doble reserva)
    // ─────────────────────────────────────────────

    @Transactional
    public AppointmentResponse reservarCita(AppointmentRequest request) {
        // Validar duración permitida
        if (request.getDuracion() != 40 && request.getDuracion() != 60) {
            throw new BusinessException(
                "La duración debe ser 40 o 60 minutos."
            );
        }

        // Validar ubicación para citas presenciales
        // Validar alumno y maestro
        Usuario alumno = usuarioRepository
            .findById(request.getIdAlumno())
            .orElseThrow(() ->
                new ResourceNotFoundException("Alumno no encontrado.")
            );

        Usuario maestro = usuarioRepository
            .findById(request.getIdMaestro())
            .orElseThrow(() ->
                new ResourceNotFoundException("Maestro no encontrado.")
            );

        // Obtener slot y validar disponibilidad (BR-01)
        Slot slot = slotRepository
            .findById(request.getIdSlot())
            .orElseThrow(() ->
                new ResourceNotFoundException("Slot no encontrado.")
            );

        if (!slot.getDisponible()) {
            throw new BusinessException(
                "El slot seleccionado ya no está disponible."
            );
        }

        // Verificar doble reserva por unicidad en citas (BR-01)
        if (citaRepository.existsBySlotIdSlot(slot.getIdSlot())) {
            throw new BusinessException("Este slot ya fue reservado.");
        }

        // Calcular hora inicio y fin de la cita
        LocalDateTime horaInicio = LocalDateTime.of(
            slot.getFecha(),
            slot.getHoraInicio()
        );
        LocalDateTime horaFin = horaInicio.plusMinutes(request.getDuracion());

        // Bloquear el slot
        slot.setDisponible(false);
        slotRepository.save(slot);

        // Crear la cita
        Cita cita = new Cita();
        cita.setAlumno(alumno);
        cita.setMaestro(maestro);
        cita.setSlot(slot);
        cita.setHoraInicio(horaInicio);
        cita.setHoraFin(horaFin);
        cita.setDuracion(request.getDuracion());
        cita.setModalidad(request.getModalidad());
        cita.setEstado(EstadoCita.Agendada);
        cita.setDescripcionClase(request.getDescripcionClase());

        // Generar Meet link automáticamente si es VIRTUAL
        if (request.getModalidad() == Modalidad.VIRTUAL) {
            String meetLink = googleCalendarService.crearEventoMeet(
                horaInicio,
                horaFin,
                alumno.getNombres() + " " + alumno.getApellidos(),
                alumno.getCorreo(),
                maestro.getNombres() + " " + maestro.getApellidos(),
                maestro.getCorreo(),
                request.getDescripcionClase()
            );
            cita.setLinkMeet(meetLink);
        }

        // Generar QR si la cita es PRESENCIAL (se guarda como Base64)
        if (request.getModalidad() == Modalidad.PRESENCIAL) {
            String ubicacionFinal =
                slot.getUbicacion() != null && !slot.getUbicacion().trim().isEmpty()
                    ? slot.getUbicacion().trim()
                    : (request.getUbicacion() != null ? request.getUbicacion().trim() : null);

            if (ubicacionFinal == null || ubicacionFinal.isEmpty()) {
                throw new BusinessException(
                    "La ubicación es obligatoria para citas presenciales. Pide al maestro configurar la ubicación del horario."
                );
            }

            cita.setUbicacion(ubicacionFinal);
            String contenidoQr = String.format(
                "NextWork | Cita #%s | Alumno: %s %s | Maestro: %s %s | %s %s-%s | Ubicación: %s",
                "NUEVA",
                alumno.getNombres(),
                alumno.getApellidos(),
                maestro.getNombres(),
                maestro.getApellidos(),
                slot.getFecha(),
                slot.getHoraInicio(),
                slot.getHoraFin(),
                ubicacionFinal
            );
            cita.setCodigoQr(qrUtil.generarQrBase64(contenidoQr));
        }

        Cita guardada = citaRepository.save(cita);

        // Enviar emails de confirmación al alumno y al maestro
        try {
            String modalidadStr = guardada.getModalidad().name();
            
            // Email al alumno
            emailService.enviarEmailConfirmacionCita(
                alumno.getCorreo(),
                alumno.getNombres(),
                true, // esAlumno
                alumno.getNombres() + " " + alumno.getApellidos(),
                maestro.getNombres() + " " + maestro.getApellidos(),
                guardada.getHoraInicio(),
                guardada.getHoraFin(),
                guardada.getDuracion(),
                modalidadStr,
                guardada.getLinkMeet(),
                guardada.getUbicacion(),
                guardada.getDescripcionClase(),
                guardada.getCodigoQr()
            );

            // Email al maestro
            emailService.enviarEmailConfirmacionCita(
                maestro.getCorreo(),
                maestro.getNombres(),
                false, // NO esAlumno
                alumno.getNombres() + " " + alumno.getApellidos(),
                maestro.getNombres() + " " + maestro.getApellidos(),
                guardada.getHoraInicio(),
                guardada.getHoraFin(),
                guardada.getDuracion(),
                modalidadStr,
                guardada.getLinkMeet(),
                guardada.getUbicacion(),
                guardada.getDescripcionClase(),
                guardada.getCodigoQr()
            );
        } catch (Exception e) {
            // No bloquear la reserva si falla el email
            // El error ya está logueado en EmailService
        }

        return mapearCita(guardada);
    }

    // ─────────────────────────────────────────────
    // CANCELAR CITA (BR-02: mínimo 24h antes)
    // ─────────────────────────────────────────────

    @Transactional
    public void cancelarCita(Long idCita) {
        Cita cita = citaRepository
            .findById(idCita)
            .orElseThrow(() ->
                new ResourceNotFoundException("Cita no encontrada.")
            );

        // Verificar estado antes de la ventana de tiempo (BR-02)
        // Si ya está cancelada o completada no tiene sentido validar las 24h
        if (cita.getEstado() == EstadoCita.Cancelada) {
            throw new BusinessException("La cita ya fue cancelada.");
        }

        if (cita.getEstado() == EstadoCita.Completada) {
            throw new BusinessException(
                "No se puede cancelar una cita ya completada."
            );
        }

        validarVentanaCancelacion(cita.getHoraInicio());

        // Liberar el slot
        Slot slot = cita.getSlot();
        slot.setDisponible(true);
        slotRepository.save(slot);

        cita.setEstado(EstadoCita.Cancelada);
        citaRepository.save(cita);
    }

    // ─────────────────────────────────────────────
    // REAGENDAR CITA (BR-02: mínimo 24h antes)
    // ─────────────────────────────────────────────

    @Transactional
    public AppointmentResponse reagendarCita(
        Long idCita,
        RescheduleRequest request
    ) {
        Cita cita = citaRepository
            .findById(idCita)
            .orElseThrow(() ->
                new ResourceNotFoundException("Cita no encontrada.")
            );

        validarVentanaCancelacion(cita.getHoraInicio());

        if (
            cita.getEstado() == EstadoCita.Cancelada ||
            cita.getEstado() == EstadoCita.Completada
        ) {
            throw new BusinessException(
                "No se puede reagendar una cita cancelada o completada."
            );
        }

        // Validar nuevo slot
        Slot slotNuevo = slotRepository
            .findById(request.getIdSlotNuevo())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "El nuevo slot no fue encontrado."
                )
            );

        if (!slotNuevo.getDisponible()) {
            throw new BusinessException(
                "El nuevo slot seleccionado no está disponible."
            );
        }

        if (citaRepository.existsBySlotIdSlot(slotNuevo.getIdSlot())) {
            throw new BusinessException("El nuevo slot ya fue reservado.");
        }

        // Liberar slot anterior
        Slot slotAnterior = cita.getSlot();
        slotAnterior.setDisponible(true);
        slotRepository.save(slotAnterior);

        // Bloquear nuevo slot
        slotNuevo.setDisponible(false);
        slotRepository.save(slotNuevo);

        // Actualizar cita
        LocalDateTime nuevaHoraInicio = LocalDateTime.of(
            slotNuevo.getFecha(),
            slotNuevo.getHoraInicio()
        );
        LocalDateTime nuevaHoraFin = nuevaHoraInicio.plusMinutes(
            cita.getDuracion()
        );

        cita.setSlot(slotNuevo);
        cita.setHoraInicio(nuevaHoraInicio);
        cita.setHoraFin(nuevaHoraFin);
        cita.setEstado(EstadoCita.Reagendada);

        Cita actualizada = citaRepository.save(cita);
        return mapearCita(actualizada);
    }

    // ─────────────────────────────────────────────
    // HISTORIAL DEL ALUMNO
    // ─────────────────────────────────────────────

    public List<AppointmentResponse> historialAlumno(Long idAlumno) {
        usuarioRepository
            .findById(idAlumno)
            .orElseThrow(() ->
                new ResourceNotFoundException("Alumno no encontrado.")
            );

        return citaRepository
            .findByAlumnoIdUsuario(idAlumno)
            .stream()
            .map(this::mapearCita)
            .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // HISTORIAL DEL MAESTRO CON FILTROS AVANZADOS
    // ─────────────────────────────────────────────

    public List<AppointmentResponse> historialMaestro(
        Long idMaestro,
        LocalDateTime desde,
        LocalDateTime hasta,
        EstadoCita estado,
        Modalidad modalidad
    ) {
        usuarioRepository
            .findById(idMaestro)
            .orElseThrow(() ->
                new ResourceNotFoundException("Maestro no encontrado.")
            );

        List<Cita> citas;

        // Aplicar filtros combinados según los parámetros recibidos
        boolean tieneRango = desde != null && hasta != null;
        boolean tieneEstado = estado != null;
        boolean tieneModalidad = modalidad != null;

        if (tieneRango && tieneEstado && tieneModalidad) {
            citas =
                citaRepository.findByMaestroIdUsuarioAndEstadoAndModalidadAndHoraInicioBetween(
                    idMaestro,
                    estado,
                    modalidad,
                    desde,
                    hasta
                );
        } else if (tieneRango && tieneEstado) {
            citas = citaRepository
                .findByMaestroIdUsuarioAndEstado(idMaestro, estado)
                .stream()
                .filter(
                    c ->
                        !c.getHoraInicio().isBefore(desde) &&
                        !c.getHoraInicio().isAfter(hasta)
                )
                .collect(Collectors.toList());
        } else if (tieneRango && tieneModalidad) {
            citas = citaRepository
                .findByMaestroIdUsuarioAndModalidad(idMaestro, modalidad)
                .stream()
                .filter(
                    c ->
                        !c.getHoraInicio().isBefore(desde) &&
                        !c.getHoraInicio().isAfter(hasta)
                )
                .collect(Collectors.toList());
        } else if (tieneEstado && tieneModalidad) {
            citas = citaRepository
                .findByMaestroIdUsuarioAndEstado(idMaestro, estado)
                .stream()
                .filter(c -> c.getModalidad() == modalidad)
                .collect(Collectors.toList());
        } else if (tieneRango) {
            citas = citaRepository.findByMaestroIdUsuarioAndHoraInicioBetween(
                idMaestro,
                desde,
                hasta
            );
        } else if (tieneEstado) {
            citas = citaRepository.findByMaestroIdUsuarioAndEstado(
                idMaestro,
                estado
            );
        } else if (tieneModalidad) {
            citas = citaRepository.findByMaestroIdUsuarioAndModalidad(
                idMaestro,
                modalidad
            );
        } else {
            citas = citaRepository.findByMaestroIdUsuario(idMaestro);
        }

        return citas
            .stream()
            .map(this::mapearCita)
            .collect(Collectors.toList());
    }

    @Transactional
    public RatingResponse calificarCita(
        Long idCita,
        RatingRequest request,
        Long idUsuarioAuth,
        String rolAuth
    ) {
        Cita cita = citaRepository
            .findById(idCita)
            .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada."));

        if (cita.getEstado() != EstadoCita.Completada) {
            throw new BusinessException(
                "Solo se pueden calificar citas en estado completada."
            );
        }

        if (
            calificacionCitaRepository.existsByCitaIdCitaAndEvaluadorIdUsuario(
                idCita,
                idUsuarioAuth
            )
        ) {
            throw new BusinessException("Ya calificaste esta clase.");
        }

        Usuario evaluador;
        Usuario evaluado;
        String rolEvaluador;
        String rolEvaluado;

        if ("ROLE_ALUMNO".equals(rolAuth)) {
            if (!cita.getAlumno().getIdUsuario().equals(idUsuarioAuth)) {
                throw new BusinessException("No puedes calificar una cita ajena.");
            }
            evaluador = cita.getAlumno();
            evaluado = cita.getMaestro();
            rolEvaluador = "ROLE_ALUMNO";
            rolEvaluado = "ROLE_MAESTRO";
        } else if ("ROLE_MAESTRO".equals(rolAuth)) {
            if (!cita.getMaestro().getIdUsuario().equals(idUsuarioAuth)) {
                throw new BusinessException("No puedes calificar una cita ajena.");
            }
            evaluador = cita.getMaestro();
            evaluado = cita.getAlumno();
            rolEvaluador = "ROLE_MAESTRO";
            rolEvaluado = "ROLE_ALUMNO";
        } else {
            throw new BusinessException(
                "Tu rol no tiene permisos para calificar citas."
            );
        }

        CalificacionCita calificacion = new CalificacionCita();
        calificacion.setCita(cita);
        calificacion.setEvaluador(evaluador);
        calificacion.setEvaluado(evaluado);
        calificacion.setRolEvaluador(rolEvaluador);
        calificacion.setRolEvaluado(rolEvaluado);
        calificacion.setEstrellas(request.getEstrellas().byteValue());
        calificacion.setAsistio(request.getAsistio());
        calificacion.setComentario(
            request.getComentario() == null || request.getComentario().trim().isEmpty()
                ? null
                : request.getComentario().trim()
        );

        CalificacionCita guardada = calificacionCitaRepository.save(calificacion);
        return mapearCalificacion(guardada);
    }

    public Optional<RatingResponse> obtenerMiCalificacion(Long idCita, Long idUsuarioAuth) {
        return calificacionCitaRepository
            .findByCitaIdCitaAndEvaluadorIdUsuario(idCita, idUsuarioAuth)
            .map(this::mapearCalificacion);
    }

    // ─────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────

    private void validarVentanaCancelacion(LocalDateTime horaCita) {
        if (
            LocalDateTime.now()
                .plusHours(HORAS_MINIMAS_CANCELACION)
                .isAfter(horaCita)
        ) {
            throw new BusinessException(
                "Solo se puede cancelar o reagendar con al menos 24 horas de anticipación."
            );
        }
    }

    private SlotDTO mapearSlot(Slot slot) {
        return new SlotDTO(
            slot.getIdSlot(),
            slot.getMaestro().getIdUsuario(),
            slot.getMaestro().getNombres() +
                " " +
                slot.getMaestro().getApellidos(),
            slot.getFecha(),
            slot.getHoraInicio(),
            slot.getHoraFin(),
            slot.getDisponible(),
            slot.getModalidad(),
            slot.getUbicacion()
        );
    }

    private AppointmentResponse mapearCita(Cita cita) {
        return new AppointmentResponse(
            cita.getIdCita(),
            cita.getAlumno().getIdUsuario(),
            cita.getAlumno().getNombres() +
                " " +
                cita.getAlumno().getApellidos(),
            cita.getMaestro().getIdUsuario(),
            cita.getMaestro().getNombres() +
                " " +
                cita.getMaestro().getApellidos(),
            cita.getSlot().getIdSlot(),
            cita.getHoraInicio(),
            cita.getHoraFin(),
            cita.getDuracion(),
            cita.getModalidad(),
            cita.getEstado(),
            cita.getDescripcionClase(),
            cita.getUbicacion(),
            cita.getLinkMeet(),
            cita.getCodigoQr(),
            cita.getFechaCreacion()
        );
    }

    private RatingResponse mapearCalificacion(CalificacionCita calificacion) {
        return new RatingResponse(
            calificacion.getIdCalificacion(),
            calificacion.getCita().getIdCita(),
            calificacion.getEvaluador().getIdUsuario(),
            calificacion.getEvaluado().getIdUsuario(),
            calificacion.getEstrellas().intValue(),
            calificacion.getAsistio(),
            calificacion.getComentario(),
            calificacion.getFechaCreacion()
        );
    }
}
