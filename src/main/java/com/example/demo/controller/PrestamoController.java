package com.example.demo.controller;
import com.example.demo.dto.PrestamoDTO;
import com.example.demo.model.Prestamo;
import com.example.demo.service.PrestamoService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prestamos")
public class PrestamoController {

    private final PrestamoService prestamoService;

    public PrestamoController(PrestamoService prestamoService) {
        this.prestamoService = prestamoService;
    }

    @PostMapping("/solicitar")
    public Prestamo solicitarPrestamo(@RequestBody PrestamoDTO dto) {
        return prestamoService.solicitarPrestamo(dto);
    }

    @PutMapping("/{id}/aprobar")
    public Prestamo aprobarPrestamo(@PathVariable Long id) {
        return prestamoService.aprobarPrestamo(id);
    }

    @PutMapping("/{id}/devolver")
    public Prestamo registrarDevolucion(@PathVariable Long id) {
        return prestamoService.registrarDevolucion(id);
    }

    @PutMapping("/{id}/rechazar")
    public Prestamo rechazarPrestamo(@PathVariable Long id) {

        return prestamoService.rechazarPrestamo(id);
    }
}
