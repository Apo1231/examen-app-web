package com.nextwork.Service;

import com.nextwork.Dto.SlotDTO;
import com.nextwork.Dto.SlotRequest;
import com.nextwork.Excepcion.BusinessException;
import com.nextwork.Excepcion.ResourceNotFoundException;
import com.nextwork.Model.entity.Slot;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Service.Repository.SlotRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SlotService {

    private static final String ROL_MAESTRO = "ROLE_MAESTRO";

    private final SlotRepository slotRepository;
    private final UsuarioRepository usuarioRepository;

    // ─────────────────────────────────────────────
    // CREAR SLOT (idMaestro extraído del JWT)
    // ─────────────────────────────────────────────

    @Transactional
    public SlotDTO crearSlot(Long idMaestro, SlotRequest request) {
        Usuario maestro = usuarioRepository
            .findById(idMaestro)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Maestro no encontrado con id: " + idMaestro
                )
            );

        if (!ROL_MAESTRO.equals(maestro.getRol().getNombreRol())) {
            throw new BusinessException("El usuario no tiene rol de maestro.");
        }

        if (
            request.getFecha() == null ||
            request.getHoraInicio() == null ||
            request.getHoraFin() == null
        ) {
            throw new BusinessException(
                "Fecha, horaInicio y horaFin son obligatorios."
            );
        }

        if (!request.getHoraInicio().isBefore(request.getHoraFin())) {
            throw new BusinessException(
                "La hora de inicio debe ser anterior a la hora de fin."
            );
        }

        if (
            request.getModalidad() != null &&
            request.getModalidad().name().equals("PRESENCIAL") &&
            (request.getUbicacion() == null || request.getUbicacion().trim().isEmpty())
        ) {
            throw new BusinessException(
                "La ubicación es obligatoria para slots presenciales."
            );
        }

        Slot slot = new Slot();
        slot.setMaestro(maestro);
        slot.setFecha(request.getFecha());
        slot.setHoraInicio(request.getHoraInicio());
        slot.setHoraFin(request.getHoraFin());
        slot.setModalidad(request.getModalidad());
        slot.setUbicacion(
            request.getUbicacion() == null || request.getUbicacion().trim().isEmpty()
                ? null
                : request.getUbicacion().trim()
        );
        slot.setDisponible(true);

        Slot guardado = slotRepository.save(slot);
        return toSlotDTO(guardado);
    }

    // ─────────────────────────────────────────────
    // ELIMINAR SLOT (solo si pertenece al maestro y está disponible)
    // ─────────────────────────────────────────────

    @Transactional
    public void eliminarSlot(Long idSlot, Long idMaestro) {
        Slot slot = slotRepository
            .findById(idSlot)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Slot no encontrado con id: " + idSlot
                )
            );

        if (!slot.getMaestro().getIdUsuario().equals(idMaestro)) {
            throw new BusinessException(
                "No tienes permiso para eliminar este slot."
            );
        }

        if (!Boolean.TRUE.equals(slot.getDisponible())) {
            throw new BusinessException(
                "No se puede eliminar un slot que ya fue reservado."
            );
        }

        slotRepository.delete(slot);
    }

    // ─────────────────────────────────────────────
    // OBTENER TODOS LOS SLOTS DEL MAESTRO AUTENTICADO
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SlotDTO> obtenerSlotsDelMaestro(Long idMaestro) {
        return slotRepository
            .findByMaestroIdUsuario(idMaestro)
            .stream()
            .map(this::toSlotDTO)
            .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // HELPER PRIVADO
    // ─────────────────────────────────────────────

    private SlotDTO toSlotDTO(Slot slot) {
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
}
