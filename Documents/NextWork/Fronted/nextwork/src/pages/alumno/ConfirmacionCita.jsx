import { useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  User,
  Calendar,
  Clock,
  Video,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import {
  formatFecha,
  formatHora,
  formatModalidad,
} from "../../utils/formatters";

export default function ConfirmacionCita() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const apt = state?.appointment;

  if (!apt) {
    return (
      <div className="min-h-screen bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <p className="text-muted mb-3">
            No se encontró información de la cita.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/alumno")}
          >
            Reservar una clase
          </button>
        </div>
      </div>
    );
  }

  const fechaStr = apt.horaInicio?.split("T")[0];
  const horaInicioStr = apt.horaInicio?.split("T")[1] ?? apt.horaInicio;
  const horaFinStr = apt.horaFin?.split("T")[1] ?? apt.horaFin;
  const esVirtual = apt.modalidad === "VIRTUAL";

  return (
    <div className="min-h-screen bg-light">
      {/* Header â€” logo only */}
      <header className="bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <div className="d-flex align-items-center py-3">
            <img
              src="/NexWordLogo.svg"
              alt="NextWork"
              className="nextword-logo nextword-logo-header nextword-logo-landing"
            />
          </div>
        </div>
      </header>

      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            {/* Success Card */}
            <div className="card shadow-lg border-0 mb-4">
              <div className="card-body p-5">
                {/* Success Icon + Title */}
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success mb-3"
                    style={{ width: "5rem", height: "5rem" }}
                  >
                    <Check size={48} color="white" />
                  </div>
                  <h2 className="h3 mb-2">¡Clase Agendada Exitosamente!</h2>
                  <p className="text-muted">
                    Tu clase ha sido confirmada. Recibirás un correo electrónico
                    con los detalles.
                  </p>
                </div>

                {/* Booking Details */}
                <div className="border-top pt-4">
                  <h5 className="mb-4">Detalles de la Clase</h5>

                  <div className="row g-4">
                    {/* Teacher */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <User size={24} className="text-primary" />
                        <div>
                          <small className="text-muted d-block">Profesor</small>
                          <strong>{apt.nombreMaestro}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <Calendar size={24} className="text-primary" />
                        <div>
                          <small className="text-muted d-block">Fecha</small>
                          <strong>{formatFecha(fechaStr)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <Clock size={24} className="text-primary" />
                        <div>
                          <small className="text-muted d-block">Hora</small>
                          <strong>
                            {formatHora(horaInicioStr)} –{" "}
                            {formatHora(horaFinStr)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Modalidad */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        {esVirtual ? (
                          <Video size={24} className="text-primary" />
                        ) : (
                          <MapPin size={24} className="text-primary" />
                        )}
                        <div>
                          <small className="text-muted d-block">
                            Modalidad
                          </small>
                          <strong>{formatModalidad(apt.modalidad)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {apt.descripcionClase && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <small className="text-muted d-block mb-1">
                            Descripción
                          </small>
                          <p className="mb-0">{apt.descripcionClase}</p>
                        </div>
                      </div>
                    )}

                    {/* Meet link */}
                    {esVirtual && apt.linkMeet && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <small className="text-muted d-block mb-1">
                            Link de la clase
                          </small>
                          <a
                            href={apt.linkMeet}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary"
                          >
                            {apt.linkMeet}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* QR â€” only for PRESENCIAL */}
                    {!esVirtual && apt.codigoQr && (
                      <div className="col-12 text-center">
                        <div className="p-3 bg-light rounded">
                          <small className="text-muted d-block mb-2">
                            Presenta este código QR al llegar a tu clase
                            presencial
                          </small>
                          <img
                            src={`data:image/png;base64,${apt.codigoQr}`}
                            alt="Código QR de la cita"
                            style={{ maxWidth: 180 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-top pt-4 mt-4">
                  <div className="d-flex gap-3 justify-content-center">
                    <button
                      className="btn btn-outline-secondary d-flex align-items-center gap-2"
                      onClick={() => navigate("/alumno")}
                    >
                      <ArrowLeft size={16} />
                      Agendar Otra Clase
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate("/alumno")}
                    >
                      Ir al Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className="alert alert-info">
              <strong>Próximos Pasos:</strong>
              <ul className="mb-0 mt-2">
                <li>Recibirás un correo de confirmación</li>
                <li>Puedes ver tus clases agendadas en tu dashboard</li>
                <li>Te enviaremos un recordatorio antes de tu clase</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
