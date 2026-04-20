package com.nextwork.Service;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void enviarEmailRecuperacion(String correo, String nombre, String linkReset) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(correo);
            helper.setSubject("Recupera tu contraseña de NextWork");

            String html = """
                    <!DOCTYPE html>
                    <html lang="es">
                    <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0;">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
                        <tr>
                          <td align="center">
                            <table width="560" cellpadding="0" cellspacing="0"
                                   style="background:#ffffff; border-radius:8px; padding:40px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                              <tr>
                                <td align="center" style="padding-bottom:24px;">
                                  <span style="font-size:28px; font-weight:700; color:#1d4ed8;">NextWork</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:16px;">
                                  <h2 style="margin:0; font-size:20px; color:#111827;">Recuperar contraseña</h2>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:16px; color:#374151; font-size:15px; line-height:1.6;">
                                  Hola, <strong>%s</strong>.<br><br>
                                  Recibimos una solicitud para restablecer la contraseña de tu cuenta en NextWork.
                                  Haz clic en el botón de abajo para crear una nueva contraseña.
                                  El enlace es válido por <strong>30 minutos</strong>.
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding: 24px 0;">
                                  <a href="%s"
                                     style="background-color:#2563eb; color:#ffffff; text-decoration:none;
                                            padding:14px 32px; border-radius:6px; font-size:15px; font-weight:600;
                                            display:inline-block;">
                                    Restablecer contraseña
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="color:#6b7280; font-size:13px; line-height:1.6;">
                                  Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.<br>
                                  Tu contraseña no cambiará hasta que hagas clic en el enlace de arriba.<br><br>
                                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                  <a href="%s" style="color:#2563eb;">%s</a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-top:32px; border-top:1px solid #e5e7eb; margin-top:32px;">
                                  <p style="color:#9ca3af; font-size:12px; margin:0;">
                                    &copy; 2025 NextWork. Todos los derechos reservados.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                    </html>
                    """.formatted(nombre, linkReset, linkReset, linkReset);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email de recuperación enviado a {}", correo);

        } catch (Exception e) {
            log.error("Error al enviar email de recuperación a {}: {}", correo, e.getMessage(), e);
            throw new RuntimeException("No se pudo enviar el correo de recuperación. Intenta más tarde.");
        }
    }

    /**
     * Envía email de confirmación de cita al alumno y al maestro.
     * Este método NO lanza excepción para evitar bloquear la reserva si falla el email.
     *
     * @param correo Email del destinatario
     * @param nombre Nombre del destinatario
     * @param esAlumno true si es el alumno, false si es el maestro
     * @param nombreAlumno Nombre completo del alumno
     * @param nombreMaestro Nombre completo del maestro
     * @param horaInicio Hora de inicio de la cita
     * @param horaFin Hora de fin de la cita
     * @param duracion Duración en minutos
     * @param modalidad "VIRTUAL" o "PRESENCIAL"
     * @param meetLink Link de Google Meet (null si es presencial)
     * @param ubicacion Ubicación física (null si es virtual)
     * @param descripcion Descripción de la clase
     * @param codigoQr QR en Base64 (sin prefijo data:image/...) para modalidad presencial
     */
    public void enviarEmailConfirmacionCita(
        String correo,
        String nombre,
        boolean esAlumno,
        String nombreAlumno,
        String nombreMaestro,
        LocalDateTime horaInicio,
        LocalDateTime horaFin,
        int duracion,
        String modalidad,
        String meetLink,
        String ubicacion,
        String descripcion,
        String codigoQr
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(correo);
            helper.setSubject("Confirmación de cita - NextWork");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm");
            String fechaFormateada = horaInicio.format(formatter);
            String horaFinFormateada = horaFin.format(DateTimeFormatter.ofPattern("HH:mm"));

            String rolDestinatario = esAlumno ? "Alumno" : "Maestro";
            String otraParte = esAlumno ? nombreMaestro : nombreAlumno;
            String labelOtraParte = esAlumno ? "Maestro" : "Alumno";

            String qrCid = null;
            byte[] qrBytes = null;
            if ("PRESENCIAL".equals(modalidad) && codigoQr != null && !codigoQr.isBlank()) {
                try {
                    qrBytes = Base64.getDecoder().decode(codigoQr);
                    qrCid = "qr-cita-" + System.currentTimeMillis();
                } catch (IllegalArgumentException e) {
                    log.warn("QR Base64 inválido para cita presencial en correo a {}", correo);
                }
            }

            // Sección de detalles según modalidad
            String detallesModalidad;
            if ("VIRTUAL".equals(modalidad) && meetLink != null && !meetLink.isBlank()) {
                detallesModalidad = String.format("""
                    <tr>
                      <td style="padding-bottom:16px; color:#374151; font-size:15px;">
                        <strong>Link de Google Meet:</strong><br>
                        <a href="%s" style="color:#2563eb; word-break:break-all;">%s</a>
                      </td>
                    </tr>
                    """, meetLink, meetLink);
            } else if ("PRESENCIAL".equals(modalidad) && ubicacion != null && !ubicacion.isBlank()) {
                String bloqueQr = qrCid != null ? String.format("""
                    <tr>
                      <td style="padding-bottom:16px; color:#374151; font-size:15px; text-align:center;">
                        <strong>Código QR de la cita:</strong><br><br>
                        <img src="cid:%s" alt="Código QR de cita presencial" style="max-width:220px; height:auto; border:1px solid #e5e7eb; border-radius:8px; padding:8px; background:#fff;" />
                      </td>
                    </tr>
                    """, qrCid) : "";

                detallesModalidad = String.format("""
                    <tr>
                      <td style="padding-bottom:16px; color:#374151; font-size:15px;">
                        <strong>Ubicación:</strong> %s
                      </td>
                    </tr>
                    %s
                    """, ubicacion, bloqueQr);
            } else {
                detallesModalidad = "";
            }

            String html = String.format("""
                <!DOCTYPE html>
                <html lang="es">
                <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
                    <tr>
                      <td align="center">
                        <table width="560" cellpadding="0" cellspacing="0"
                               style="background:#ffffff; border-radius:8px; padding:40px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                          <tr>
                            <td align="center" style="padding-bottom:24px;">
                              <span style="font-size:28px; font-weight:700; color:#1d4ed8;">NextWork</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:16px;">
                              <h2 style="margin:0; font-size:20px; color:#111827;">¡Cita confirmada!</h2>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:16px; color:#374151; font-size:15px; line-height:1.6;">
                              Hola, <strong>%s</strong>.<br><br>
                              Tu cita ha sido agendada exitosamente con los siguientes detalles:
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 0; background:#f3f4f6; border-radius:6px;">
                              <table width="100%%" cellpadding="8" cellspacing="0">
                                <tr>
                                  <td style="color:#374151; font-size:14px;"><strong>%s:</strong></td>
                                  <td style="color:#111827; font-size:14px;">%s</td>
                                </tr>
                                <tr>
                                  <td style="color:#374151; font-size:14px;"><strong>Fecha y hora:</strong></td>
                                  <td style="color:#111827; font-size:14px;">%s - %s</td>
                                </tr>
                                <tr>
                                  <td style="color:#374151; font-size:14px;"><strong>Duración:</strong></td>
                                  <td style="color:#111827; font-size:14px;">%d minutos</td>
                                </tr>
                                <tr>
                                  <td style="color:#374151; font-size:14px;"><strong>Modalidad:</strong></td>
                                  <td style="color:#111827; font-size:14px;">%s</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          %s
                          <tr>
                            <td style="padding-top:16px; color:#374151; font-size:14px; line-height:1.6;">
                              <strong>Descripción:</strong><br>
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top:24px; color:#6b7280; font-size:13px; line-height:1.6;">
                              <strong>Importante:</strong> Recuerda que puedes cancelar la cita con al menos 24 horas de anticipación.<br>
                              Si tienes alguna duda, ponte en contacto con soporte.
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top:32px; border-top:1px solid #e5e7eb; margin-top:32px;">
                              <p style="color:#9ca3af; font-size:12px; margin:0;">
                                &copy; 2025 NextWork. Todos los derechos reservados.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """,
                nombre,
                labelOtraParte,
                otraParte,
                fechaFormateada,
                horaFinFormateada,
                duracion,
                modalidad,
                detallesModalidad,
                descripcion != null && !descripcion.isBlank() ? descripcion : "Sin descripción"
            );

            helper.setText(html, true);
            if (qrCid != null && qrBytes != null) {
                helper.addInline(qrCid, new ByteArrayDataSource(qrBytes, "image/png"));
            }
            mailSender.send(message);
            log.info("Email de confirmación de cita enviado a {} ({})", correo, rolDestinatario);

        } catch (Exception e) {
            // NO lanzar excepción para no bloquear la reserva
            log.error("Error al enviar email de confirmación a {}: {}", correo, e.getMessage(), e);
        }
    }
}
