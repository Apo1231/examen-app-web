package com.example.demo.controller;

import com.example.demo.model.Equipo;
import com.example.demo.service.EquipoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    private final EquipoService equipoService;

    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }

    @GetMapping("/disponibles")
    public List<Equipo> buscarEquipos(@RequestParam String nombre) {
        return equipoService.buscarEquipoDisponiblePorNombre(nombre);
    }
}