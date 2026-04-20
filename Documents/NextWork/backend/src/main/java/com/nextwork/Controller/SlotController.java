package com.nextwork.Controller;

import com.nextwork.Dto.SlotDTO;
import com.nextwork.Dto.SlotRequest;
import com.nextwork.Service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotService slotService;

    // ─────────────────────────────────────────────
    // POST /slots — crear slot (idMaestro del JWT)
    // ─────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<SlotDTO> crearSlot(@Valid @RequestBody SlotRequest request) {
        Long idMaestro = extraerIdMaestro();
        SlotDTO slot = slotService.crearSlot(idMaestro, request);
        return ResponseEntity.ok(slot);
    }

    // ─────────────────────────────────────────────
    // DELETE /slots/{id} — eliminar slot (solo si es del maestro)
    // ─────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSlot(@PathVariable Long id) {
        Long idMaestro = extraerIdMaestro();
        slotService.eliminarSlot(id, idMaestro);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────
    // GET /slots/my — obtener slots propios del maestro
    // ─────────────────────────────────────────────

    @GetMapping("/my")
    public ResponseEntity<List<SlotDTO>> obtenerMisSlots() {
        Long idMaestro = extraerIdMaestro();
        List<SlotDTO> slots = slotService.obtenerSlotsDelMaestro(idMaestro);
        return ResponseEntity.ok(slots);
    }

    // ─────────────────────────────────────────────
    // HELPER — extrae idUsuario del SecurityContext
    // JwtAuthFilter ya pobló el principal con el correo;
    // los details contienen el Map de claims.
    // ─────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Long extraerIdMaestro() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        return ((Number) details.get("idUsuario")).longValue();
    }
}
