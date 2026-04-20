package com.nextwork.Model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Entity
@Table(
    name = "calificaciones_cita",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_calificacion_cita_evaluador",
            columnNames = { "id_cita", "id_evaluador" }
        ),
    }
)
public class CalificacionCita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_calificacion")
    private Long idCalificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cita", nullable = false)
    private Cita cita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evaluador", nullable = false)
    private Usuario evaluador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evaluado", nullable = false)
    private Usuario evaluado;

    @Column(name = "rol_evaluador", nullable = false, length = 20)
    private String rolEvaluador;

    @Column(name = "rol_evaluado", nullable = false, length = 20)
    private String rolEvaluado;

    @Column(name = "estrellas", nullable = false)
    private Byte estrellas;

    @Column(name = "asistio", nullable = false)
    private Boolean asistio;

    @Column(name = "comentario", length = 500)
    private String comentario;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
