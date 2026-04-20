package com.nextwork.Service.Repository;

import com.nextwork.Model.entity.CalificacionCita;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CalificacionCitaRepository
    extends JpaRepository<CalificacionCita, Long> {
    boolean existsByCitaIdCitaAndEvaluadorIdUsuario(Long idCita, Long idEvaluador);

    Optional<CalificacionCita> findByCitaIdCitaAndEvaluadorIdUsuario(
        Long idCita,
        Long idEvaluador
    );

    @Query(
        """
        SELECT
            c.evaluado.idUsuario AS idEvaluado,
            AVG(c.estrellas) AS ratingPromedio,
            COUNT(c) AS ratingTotal
        FROM CalificacionCita c
        WHERE c.rolEvaluador = 'ROLE_ALUMNO'
          AND c.rolEvaluado = 'ROLE_MAESTRO'
          AND c.evaluado.idUsuario IN :teacherIds
        GROUP BY c.evaluado.idUsuario
        """
    )
    List<TeacherRatingSummaryProjection> findTeacherRatingSummaryByTeacherIds(
        @Param("teacherIds") List<Long> teacherIds
    );
}
