package com.nextwork.Controller;

import com.nextwork.Dto.CreateTeacherRequest;
import com.nextwork.Dto.UpdateTeacherRequest;
import com.nextwork.Dto.UpdateStudentRequest;
import com.nextwork.Dto.UserDTO;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import com.nextwork.Service.AdminService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // POST /admin/teachers
    @PostMapping("/teachers")
    public ResponseEntity<UserDTO> crearMaestro(@Valid @RequestBody CreateTeacherRequest request) {
        UserDTO maestro = adminService.crearMaestro(request);
        return ResponseEntity.ok(maestro);
    }

    // PUT /admin/teachers/{id}
    @PutMapping("/teachers/{id}")
    public ResponseEntity<UserDTO> editarMaestro(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTeacherRequest request) {
        UserDTO maestro = adminService.editarMaestro(id, request);
        return ResponseEntity.ok(maestro);
    }

    // DELETE /admin/teachers/{id}
    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<Void> desactivarMaestro(@PathVariable Long id) {
        adminService.desactivarMaestro(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /admin/students/{id}
    @PutMapping("/students/{id}")
    public ResponseEntity<UserDTO> editarAlumno(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStudentRequest request) {
        UserDTO alumno = adminService.editarAlumno(id, request);
        return ResponseEntity.ok(alumno);
    }

    // PUT /admin/reset-password/{userId}
    @PutMapping("/reset-password/{userId}")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long userId) {
        String passwordTemporal = adminService.resetPassword(userId);
        return ResponseEntity.ok(Map.of("passwordTemporal", passwordTemporal));
    }

    // GET /admin/users?name=
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> listarUsuarios(
            @RequestParam(required = false) String name) {
        List<UserDTO> usuarios = adminService.listarUsuarios(name);
        return ResponseEntity.ok(usuarios);
    }

    // GET /admin/reports/appointments/pdf?studentId=&teacherId=&dateFrom=&dateTo=&status=&modality=
    @GetMapping("/reports/appointments/pdf")
    public ResponseEntity<byte[]> reportePdf(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String modality) {

        LocalDateTime desde = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime hasta = dateTo != null ? dateTo.atTime(23, 59, 59) : null;
        EstadoCita estado = status != null ? EstadoCita.valueOf(status) : null;
        Modalidad modalidadEnum = modality != null ? Modalidad.valueOf(modality) : null;

        byte[] pdf = adminService.generarReportePdf(studentId, teacherId, desde, hasta, estado, modalidadEnum);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte-citas.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // GET /admin/reports/appointments/excel?studentId=&teacherId=&dateFrom=&dateTo=&status=&modality=
    @GetMapping("/reports/appointments/excel")
    public ResponseEntity<byte[]> reporteExcel(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String modality) {

        LocalDateTime desde = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime hasta = dateTo != null ? dateTo.atTime(23, 59, 59) : null;
        EstadoCita estado = status != null ? EstadoCita.valueOf(status) : null;
        Modalidad modalidadEnum = modality != null ? Modalidad.valueOf(modality) : null;

        byte[] excel = adminService.generarReporteExcel(studentId, teacherId, desde, hasta, estado, modalidadEnum);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte-citas.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

}
