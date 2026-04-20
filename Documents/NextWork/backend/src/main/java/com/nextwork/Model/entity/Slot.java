package com.nextwork.Model.entity;

import com.nextwork.Model.enums.Modalidad;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "slots")
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_slot")
    private Long idSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_maestro", nullable = false)
    private Usuario maestro;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(name = "disponible")
    private Boolean disponible = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "modalidad", length = 20)
    private Modalidad modalidad;

    @Column(name = "ubicacion", length = 200)
    private String ubicacion;
}
