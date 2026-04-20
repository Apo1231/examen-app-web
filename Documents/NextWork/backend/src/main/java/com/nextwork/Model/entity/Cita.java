package com.nextwork.Model.entity;

import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "citas")
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Long idCita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_alumno", nullable = false)
    private Usuario alumno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_maestro", nullable = false)
    private Usuario maestro;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_slot", nullable = false, unique = true)
    private Slot slot;

    @Column(name = "hora_inicio", nullable = false)
    private LocalDateTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalDateTime horaFin;

    @Column(name = "duracion", nullable = false)
    private Integer duracion;

    @Enumerated(EnumType.STRING)
    @Column(name = "modalidad", nullable = false)
    private Modalidad modalidad;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoCita estado = EstadoCita.Agendada;

    @Column(name = "descripcion_clase", columnDefinition = "TEXT")
    private String descripcionClase;

    @Column(name = "ubicacion", length = 200)
    private String ubicacion;  // Solo para citas presenciales

    @Column(name = "link_meet", length = 255)
    private String linkMeet;

    @Column(name = "codigo_qr", columnDefinition = "TEXT")
    private String codigoQr;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
