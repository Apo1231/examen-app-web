package com.nextwork.Service;

import com.nextwork.Model.entity.Cita;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Service.Repository.CitaRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled task that automatically transitions appointments to Completada
 * once their end time (horaFin) has passed and they are still in an active state.
 *
 * Runs every minute. Only Agendada and Reagendada appointments are eligible —
 * Cancelada and Completada are terminal states and are never touched.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CitaScheduler {

    private final CitaRepository citaRepository;

    /**
     * Every minute: find all Agendada/Reagendada appointments whose horaFin
     * is already in the past and mark them as Completada.
     */
    @Scheduled(cron = "0 * * * * *") // fires at second 0 of every minute
    @Transactional
    public void completarCitasPasadas() {
        LocalDateTime ahora = LocalDateTime.now();

        List<Cita> pasadas = citaRepository.findByEstadoInAndHoraFinBefore(
            List.of(EstadoCita.Agendada, EstadoCita.Reagendada),
            ahora
        );

        if (pasadas.isEmpty()) return;

        log.info(
            "[CitaScheduler] Marcando {} cita(s) como Completada (horaFin < {})",
            pasadas.size(),
            ahora
        );

        for (Cita cita : pasadas) {
            cita.setEstado(EstadoCita.Completada);
        }

        citaRepository.saveAll(pasadas);
    }
}
