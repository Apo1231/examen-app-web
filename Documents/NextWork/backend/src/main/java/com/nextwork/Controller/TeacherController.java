package com.nextwork.Controller;

import com.nextwork.Dto.UserDTO;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Service.Repository.CalificacionCitaRepository;
import com.nextwork.Service.Repository.TeacherRatingSummaryProjection;
import com.nextwork.Service.Repository.UsuarioRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final UsuarioRepository usuarioRepository;
    private final CalificacionCitaRepository calificacionCitaRepository;

    // GET /teachers — lista todos los maestros activos
    // Accesible para alumnos, maestros y admin (cualquier usuario autenticado)
    @GetMapping
    public ResponseEntity<List<UserDTO>> listarMaestros() {
        List<Usuario> maestrosEntity = usuarioRepository
            .findByRolNombreRolAndActivoTrue("ROLE_MAESTRO")
            .stream().toList();

        List<Long> teacherIds = maestrosEntity.stream()
            .map(Usuario::getIdUsuario)
            .toList();

        Map<Long, TeacherRatingSummaryProjection> ratingsByTeacher = new HashMap<>();
        if (!teacherIds.isEmpty()) {
            calificacionCitaRepository.findTeacherRatingSummaryByTeacherIds(teacherIds)
                .forEach(summary -> ratingsByTeacher.put(summary.getIdEvaluado(), summary));
        }

        List<UserDTO> maestros = maestrosEntity.stream()
            .map(usuario -> toUserDTO(usuario, ratingsByTeacher.get(usuario.getIdUsuario())))
            .collect(Collectors.toList());

        return ResponseEntity.ok(maestros);
    }

    private UserDTO toUserDTO(Usuario usuario, TeacherRatingSummaryProjection summary) {
        UserDTO dto = new UserDTO(
            usuario.getIdUsuario(),
            usuario.getNombres(),
            usuario.getApellidos(),
            usuario.getCorreo(),
            usuario.getTelefono(),
            usuario.getTelefonoEmergencia(),
            usuario.getParentesco(),
            usuario.getRol().getNombreRol(),
            usuario.getActivo(),
            usuario.getRegistroFecha()
        );
        if (summary != null) {
            dto.setRatingPromedio(summary.getRatingPromedio() == null ? 0.0 : Math.round(summary.getRatingPromedio() * 10.0) / 10.0);
            dto.setRatingTotal(summary.getRatingTotal() == null ? 0L : summary.getRatingTotal());
        }
        return dto;
    }
}
