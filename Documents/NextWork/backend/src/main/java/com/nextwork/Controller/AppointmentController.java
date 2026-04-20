package com.nextwork.Controller;

import com.nextwork.Dto.AppointmentRequest;
import com.nextwork.Dto.AppointmentResponse;
import com.nextwork.Dto.RatingRequest;
import com.nextwork.Dto.RatingResponse;
import com.nextwork.Dto.RescheduleRequest;
import com.nextwork.Dto.SlotDTO;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import com.nextwork.Service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // GET /appointments/available?teacherId=&date=
    // Público para cualquier alumno — teacherId sí se recibe como param
    // porque el alumno elige al maestro cuya agenda quiere consultar
    @GetMapping("/available")
    public ResponseEntity<List<SlotDTO>> obtenerSlotsDisponibles(
            @RequestParam Long teacherId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<SlotDTO> slots = appointmentService.obtenerSlotsDisponibles(teacherId, date);
        return ResponseEntity.ok(slots);
    }

    // POST /appointments
    @PostMapping
    public ResponseEntity<AppointmentResponse> reservarCita(@Valid @RequestBody AppointmentRequest request) {
        AppointmentResponse response = appointmentService.reservarCita(request);
        return ResponseEntity.ok(response);
    }

    // PUT /appointments/{id}/cancel
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelarCita(@PathVariable Long id) {
        appointmentService.cancelarCita(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /appointments/{id}/reschedule
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reagendarCita(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest request) {
        AppointmentResponse response = appointmentService.reagendarCita(id, request);
        return ResponseEntity.ok(response);
    }

    // GET /appointments/student — historial del alumno autenticado (id del JWT)
    @GetMapping("/student")
    public ResponseEntity<List<AppointmentResponse>> historialAlumno() {
        Long idAlumno = extraerIdUsuario();
        List<AppointmentResponse> historial = appointmentService.historialAlumno(idAlumno);
        return ResponseEntity.ok(historial);
    }

    // GET /appointments/teacher?dateFrom=&dateTo=&status=&modality=
    // id del maestro extraído del JWT — filtros opcionales via query params
    @GetMapping("/teacher")
    public ResponseEntity<List<AppointmentResponse>> historialMaestro(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String modality) {
        Long idMaestro = extraerIdUsuario();
        LocalDateTime desde = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime hasta = dateTo != null ? dateTo.atTime(23, 59, 59) : null;
        EstadoCita estado = status != null ? EstadoCita.valueOf(status) : null;
        Modalidad modalidadEnum = modality != null ? Modalidad.valueOf(modality) : null;
        List<AppointmentResponse> historial = appointmentService.historialMaestro(
                idMaestro, desde, hasta, estado, modalidadEnum);
        return ResponseEntity.ok(historial);
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<RatingResponse> calificarCita(
            @PathVariable Long id,
            @Valid @RequestBody RatingRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        Long idUsuario = ((Number) details.get("idUsuario")).longValue();
        String rol = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("");

        RatingResponse response = appointmentService.calificarCita(id, request, idUsuario, rol);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/ratings/me")
    public ResponseEntity<?> obtenerMiCalificacion(@PathVariable Long id) {
        Long idUsuario = extraerIdUsuario();
        Optional<RatingResponse> rating = appointmentService.obtenerMiCalificacion(id, idUsuario);
        return rating.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // ─────────────────────────────────────────────
    // HELPER — extrae idUsuario del SecurityContext
    // ─────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Long extraerIdUsuario() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        return ((Number) details.get("idUsuario")).longValue();
    }
}

