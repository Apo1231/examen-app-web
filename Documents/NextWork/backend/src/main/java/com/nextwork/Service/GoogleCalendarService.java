package com.nextwork.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Servicio que crea eventos en Google Calendar con conferencia Meet.
 * Usa OAuth2 Refresh Token para autenticarse sin interacción del usuario.
 */
@Slf4j
@Service
public class GoogleCalendarService {

    private static final String APPLICATION_NAME = "NextWork";
    private static final String TIMEZONE = "America/Mexico_City";

    @Value("${google.client-id}")
    private String clientId;

    @Value("${google.client-secret}")
    private String clientSecret;

    @Value("${google.refresh-token}")
    private String refreshToken;

    @Value("${google.calendar-id:primary}")
    private String calendarId;

    /**
     * Crea un evento en Google Calendar con conferencia de Google Meet.
     *
     * @param horaInicio  Inicio de la clase
     * @param horaFin     Fin de la clase
     * @param nombreAlumno Nombre completo del alumno
     * @param correoAlumno Correo del alumno (se agrega como asistente)
     * @param nombreMaestro Nombre completo del maestro
     * @param correoMaestro Correo del maestro (se agrega como asistente)
     * @param descripcion Descripción de la clase
     * @return El link de Google Meet generado, o null si falla
     */
    public String crearEventoMeet(
        LocalDateTime horaInicio,
        LocalDateTime horaFin,
        String nombreAlumno,
        String correoAlumno,
        String nombreMaestro,
        String correoMaestro,
        String descripcion
    ) {
        try {
            // 1. Construir credencial con refresh token
            @SuppressWarnings("deprecation")
            GoogleCredential credential = new GoogleCredential.Builder()
                .setTransport(GoogleNetHttpTransport.newTrustedTransport())
                .setJsonFactory(JacksonFactory.getDefaultInstance())
                .setClientSecrets(clientId, clientSecret)
                .build()
                .setRefreshToken(refreshToken);

            credential.refreshToken();

            // 2. Construir cliente de Calendar
            Calendar calendarClient = new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
            )
                .setApplicationName(APPLICATION_NAME)
                .build();

            // 3. Construir el evento
            Event event = new Event();
            event.setSummary(
                "Clase NextWork: " + nombreAlumno + " con " + nombreMaestro
            );
            event.setDescription(
                descripcion != null && !descripcion.isBlank()
                    ? descripcion
                    : "Clase de inglés agendada a través de NextWork"
            );

            // 4. Fechas en formato RFC3339
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern(
                "yyyy-MM-dd'T'HH:mm:ss"
            );
            ZoneId zone = ZoneId.of(TIMEZONE);

            EventDateTime start = new EventDateTime()
                .setDateTime(
                    new com.google.api.client.util.DateTime(
                        horaInicio.atZone(zone).toInstant().toEpochMilli()
                    )
                )
                .setTimeZone(TIMEZONE);
            EventDateTime end = new EventDateTime()
                .setDateTime(
                    new com.google.api.client.util.DateTime(
                        horaFin.atZone(zone).toInstant().toEpochMilli()
                    )
                )
                .setTimeZone(TIMEZONE);
            event.setStart(start);
            event.setEnd(end);

            // 5. Agregar asistentes
            EventAttendee alumno = new EventAttendee()
                .setEmail(correoAlumno)
                .setDisplayName(nombreAlumno);
            EventAttendee maestro = new EventAttendee()
                .setEmail(correoMaestro)
                .setDisplayName(nombreMaestro);
            event.setAttendees(java.util.List.of(alumno, maestro));

            // 6. Configurar conferencia Meet (requestId único por evento)
            ConferenceSolutionKey solutionKey =
                new ConferenceSolutionKey().setType("hangoutsMeet");
            CreateConferenceRequest createRequest =
                new CreateConferenceRequest()
                    .setRequestId(UUID.randomUUID().toString())
                    .setConferenceSolutionKey(solutionKey);
            ConferenceData conferenceData =
                new ConferenceData().setCreateRequest(createRequest);
            event.setConferenceData(conferenceData);

            // 7. Insertar evento con conferenceDataVersion=1 para que genere el Meet
            Event createdEvent = calendarClient
                .events()
                .insert(calendarId, event)
                .setConferenceDataVersion(1)
                .setSendUpdates("all") // envia invitaciones a los asistentes
                .execute();

            String meetLink = createdEvent.getHangoutLink();
            log.info(
                "[GoogleCalendarService] Evento creado. Meet link: {}",
                meetLink
            );
            return meetLink;
        } catch (Exception e) {
            // No bloquear la reserva si falla la integración con Google
            log.error(
                "[GoogleCalendarService] Error al crear evento Meet: {}",
                e.getMessage(),
                e
            );
            return null;
        }
    }
}
