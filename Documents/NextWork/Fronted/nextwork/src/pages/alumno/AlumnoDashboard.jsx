import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getTeachers } from "../../api/teachers.api";
import { getAvailableSlots } from "../../api/slots.api";
import {
  createAppointment,
  getStudentAppointments,
  cancelAppointment,
  rescheduleAppointment,
  createRating,
  getMyRatingByAppointment,
} from "../../api/appointments.api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import {
  LogOut,
  User,
  Video,
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  Clock,
  Search,
  X,
  Filter,
  Star,
  Check,
} from "lucide-react";
import {
  getInitials,
  formatFecha,
  formatHora,
  formatModalidad,
  estadoBadge,
  extractErrorMessage,
} from "../../utils/formatters";
import {
  getMondayOf,
  toLocalISO,
  DAY_NAMES,
  MONTH_NAMES,
  openQrInNewTab,
} from "../../utils/dateHelpers";

const ITEMS_PER_PAGE = 5;
const TEACHERS_PER_PAGE = 4;

// Hours shown in the grid (rows)
const GRID_HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7â€¦20

export default function AlumnoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // â”€â”€ Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeTab, setActiveTab] = useState("schedule");

  // â”€â”€ Header UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // â”€â”€ Teacher carousel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherStartIndex, setTeacherStartIndex] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalidadFiltro, setModalidadFiltro] = useState("TODAS"); // 'TODAS' | 'VIRTUAL' | 'PRESENCIAL'

  // â”€â”€ Weekly calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  // weekSlots: { [YYYY-MM-DD]: SlotDTO[] }
  const [weekSlots, setWeekSlots] = useState({});
  const [loadingWeekSlots, setLoadingWeekSlots] = useState(false);

  // â”€â”€ Selected slot + booking form (step 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotDate, setSelectedSlotDate] = useState(null); // YYYY-MM-DD
  const [duration, setDuration] = useState(60); // 40 | 60
  const [descripcion, setDescripcion] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // â”€â”€ Historial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [viewingApt, setViewingApt] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [newSlotId, setNewSlotId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingApt, setRatingApt] = useState(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingAsistio, setRatingAsistio] = useState(true);
  const [ratingComentario, setRatingComentario] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState("");
  const [alreadyRated, setAlreadyRated] = useState(false);

  const todayISO = toLocalISO(new Date());

  // â”€â”€ Load teachers on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    getTeachers()
      .then((res) => setTeachers(res.data))
      .catch(() => setTeachers([]))
      .finally(() => setLoadingTeachers(false));
  }, []);

  // â”€â”€ Load appointments on mount (auto, not lazy) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    setLoadingAppointments(true);
    getStudentAppointments()
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoadingAppointments(false));
  }, []);

  // â”€â”€ Load week slots for ALL teachers when teachers list or week changes â”€â”€
  useEffect(() => {
    if (teachers.length === 0) {
      setWeekSlots({});
      return;
    }
    setLoadingWeekSlots(true);
    setSelectedSlot(null);
    setSelectedSlotDate(null);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return toLocalISO(d);
    });

    // teacher × day → flatten into map[dayISO]
    const calls = [];
    teachers.forEach((teacher) => {
      days.forEach((dayISO) => {
        calls.push(
          getAvailableSlots(teacher.idUsuario, dayISO)
            .then((res) => ({ dayISO, slots: res.data }))
            .catch(() => ({ dayISO, slots: [] })),
        );
      });
    });

    Promise.all(calls)
      .then((results) => {
        const map = {};
        days.forEach((d) => {
          map[d] = [];
        });
        results.forEach(({ dayISO, slots }) => {
          if (slots?.length) map[dayISO] = [...map[dayISO], ...slots];
        });
        setWeekSlots(map);
      })
      .finally(() => setLoadingWeekSlots(false));
  }, [teachers, weekStart]);

  // â”€â”€ Load reschedule slots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!rescheduling || !rescheduleDate) {
      setRescheduleSlots([]);
      setNewSlotId(null);
      return;
    }
    setLoadingRescheduleSlots(true);
    getAvailableSlots(rescheduling.idMaestro, rescheduleDate)
      .then((res) => setRescheduleSlots(res.data))
      .catch(() => setRescheduleSlots([]))
      .finally(() => setLoadingRescheduleSlots(false));
  }, [rescheduling, rescheduleDate]);

  // â”€â”€ Week navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toLocalISO(d);
  });

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const weekLabel = (() => {
    const mid = new Date(weekStart);
    mid.setDate(mid.getDate() + 3);
    return `${MONTH_NAMES[mid.getMonth()]} de ${mid.getFullYear()}`;
  })();

  const weekRange = (() => {
    const last = new Date(weekStart);
    last.setDate(last.getDate() + 6);
    return `${weekStart.getDate()} - ${last.getDate()}`;
  })();

  // â”€â”€ Slot grid helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Returns the first slot matching hour, active teacher filter, and modalidad filter
  const getSlotStartingAt = (dayISO, hour) => {
    const daySlots = weekSlots[dayISO] ?? [];
    return (
      daySlots.find((s) => {
        const startH = parseInt((s.horaInicio ?? "").split(":")[0], 10);
        const matchesHour = startH === hour;
        const matchesTeacher =
          !selectedTeacher || s.idMaestro === selectedTeacher.idUsuario;
        const matchesModalidad =
          modalidadFiltro === "TODAS" || s.modalidad === modalidadFiltro;
        return matchesHour && matchesTeacher && matchesModalidad;
      }) ?? null
    );
  };

  // â”€â”€ Teacher filtering & carousel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // El carrusel solo filtra por nombre â€” la modalidad se aplica en el grid
  const filteredTeachers = teachers.filter((t) =>
    `${t.nombres} ${t.apellidos}`
      .toLowerCase()
      .includes(teacherSearch.toLowerCase()),
  );
  const visibleTeachers = filteredTeachers.slice(
    teacherStartIndex,
    teacherStartIndex + TEACHERS_PER_PAGE,
  );
  const canGoBack = teacherStartIndex > 0;
  const canGoForward =
    teacherStartIndex + TEACHERS_PER_PAGE < filteredTeachers.length;

  // â”€â”€ Booking (step 2 confirm) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setBookingError("");
    try {
      const modalidad = selectedSlot.modalidad ?? "VIRTUAL";

      const payload = {
        idSlot: selectedSlot.idSlot,
        idAlumno: user.id,
        idMaestro: selectedSlot.idMaestro,
        modalidad,
        duracion: duration,
        descripcionClase: descripcion || undefined,
      };
      const res = await createAppointment(payload);
      navigate("/alumno/confirmacion", { state: { appointment: res.data } });
    } catch (err) {
      setBookingError(extractErrorMessage(err, "Error al reservar la cita"));
    } finally {
      setBooking(false);
    }
  };

  const cancelBooking = () => {
    setSelectedSlot(null);
    setSelectedSlotDate(null);
    setDuration(60);
    setDescripcion("");
    setBookingError("");
  };

  // â”€â”€ Cancel appointment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCancel = async (id) => {
    setActionError("");
    setActionSuccess("");
    try {
      await cancelAppointment(id);
      setActionSuccess("Cita cancelada correctamente.");
      const res = await getStudentAppointments();
      setAppointments(res.data);
    } catch (err) {
      setActionError(extractErrorMessage(err, "No se pudo cancelar"));
    }
  };

  // â”€â”€ Reschedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleReschedule = async () => {
    if (!newSlotId) return;
    setSaving(true);
    setActionError("");
    setActionSuccess("");
    try {
      await rescheduleAppointment(rescheduling.idCita, {
        idSlotNuevo: newSlotId,
      });
      setActionSuccess("Cita reagendada correctamente.");
      setRescheduling(null);
      const res = await getStudentAppointments();
      setAppointments(res.data);
    } catch (err) {
      setActionError(extractErrorMessage(err, "No se pudo reagendar"));
    } finally {
      setSaving(false);
    }
  };

  // â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalHistPages = Math.max(
    1,
    Math.ceil(appointments.length / ITEMS_PER_PAGE),
  );
  const pagedAppointments = appointments.slice(
    (histPage - 1) * ITEMS_PER_PAGE,
    histPage * ITEMS_PER_PAGE,
  );

  const renderRatingStars = (avg) => {
    const value = Number(avg ?? 0);
    const rounded = Math.round(value);
    return (
      <div className="d-flex align-items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            color={star <= rounded ? "#facc15" : "#9ca3af"}
            fill={star <= rounded ? "#facc15" : "none"}
          />
        ))}
      </div>
    );
  };

  const openRatingModal = async (apt) => {
    setRatingApt(apt);
    setRatingStars(0);
    setRatingAsistio(true);
    setRatingComentario("");
    setRatingError("");
    setRatingSuccess("");
    setAlreadyRated(false);
    setShowRatingModal(true);

    try {
      const existing = await getMyRatingByAppointment(apt.idCita);
      if (existing) {
        setAlreadyRated(true);
        setRatingStars(existing.estrellas ?? 0);
        setRatingAsistio(existing.asistio ?? true);
        setRatingComentario(existing.comentario ?? "");
      }
    } catch (err) {
      setRatingError(
        extractErrorMessage(err, "No se pudo verificar la calificación"),
      );
    }
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingApt(null);
    setRatingStars(0);
    setRatingAsistio(true);
    setRatingComentario("");
    setRatingError("");
    setRatingSuccess("");
    setAlreadyRated(false);
  };

  const handleSaveRating = async () => {
    if (!ratingApt || alreadyRated) return;
    if (ratingStars < 1 || ratingStars > 5) {
      setRatingError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }

    setRatingSaving(true);
    setRatingError("");
    setRatingSuccess("");
    try {
      await createRating(ratingApt.idCita, {
        estrellas: ratingStars,
        asistio: ratingAsistio,
        comentario: ratingComentario?.trim() || undefined,
      });
      setRatingSuccess("Calificación guardada correctamente.");
      setAlreadyRated(true);
    } catch (err) {
      setRatingError(
        extractErrorMessage(err, "No se pudo guardar la calificación"),
      );
    } finally {
      setRatingSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-light">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="bg-white border-bottom sticky-top">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center py-3">
            <img
              src="/NexWordLogo.svg"
              alt="NextWork"
              className="nextword-logo nextword-logo-header nextword-logo-landing"
            />
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn btn-light"
                  type="button"
                >
                  <User size={20} />
                </button>
                {showUserMenu && (
                  <div
                    className="dropdown-menu show position-absolute end-0"
                    style={{ marginTop: "0.5rem", zIndex: 1050 }}
                  >
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setShowUserMenu(false);
                      }}
                      className="dropdown-item d-flex align-items-center gap-2"
                    >
                      <Lock size={16} />
                      Cambiar Contraseña
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={logout}
                className="btn btn-light d-flex align-items-center gap-2"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="container-fluid py-4">
        <div className="mb-4">
          <h2 className="h3 mb-2">
            Bienvenido, {user?.nombres} {user?.apellidos}
          </h2>
          <p className="text-muted">
            {activeTab === "schedule"
              ? "Selecciona un horario para agendar tu clase de inglés"
              : "Consulta tu historial de clases"}
          </p>
        </div>

        {/* Tabs */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white border-bottom">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  onClick={() => {
                    setActiveTab("schedule");
                    setHistPage(1);
                  }}
                  className={`nav-link ${activeTab === "schedule" ? "active" : ""}`}
                >
                  Agendar Clase
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => {
                    setActiveTab("history");
                    setHistPage(1);
                  }}
                  className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                >
                  Historial de Clases
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">
            {/* â•â• AGENDAR TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === "schedule" && (
              <>
                {/* â”€â”€ Filtros de Búsqueda â”€â”€ */}
                <div className="mb-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <Filter size={18} />
                    Filtros de Búsqueda
                  </h5>
                  <p className="text-muted small mb-2">Modalidad de clase</p>
                  <div
                    className="d-flex gap-0"
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                    }}
                  >
                    {[
                      { key: "TODAS", label: "Todas", icon: null },
                      {
                        key: "VIRTUAL",
                        label: "Virtual",
                        icon: <Video size={15} className="me-1" />,
                      },
                      {
                        key: "PRESENCIAL",
                        label: "Presencial",
                        icon: <MapPin size={15} className="me-1" />,
                      },
                    ].map(({ key, label, icon }, idx) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setModalidadFiltro(key);
                          setTeacherStartIndex(0);
                          setSelectedTeacher(null);
                          setSelectedSlot(null);
                          setSelectedSlotDate(null);
                        }}
                        className="btn flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          borderRadius: 0,
                          backgroundColor:
                            modalidadFiltro === key ? "#2563eb" : "#fff",
                          color: modalidadFiltro === key ? "#fff" : "#212529",
                          fontWeight: modalidadFiltro === key ? 600 : 400,
                          border: "none",
                          borderLeft: idx > 0 ? "1px solid #dee2e6" : "none",
                          padding: "0.6rem 1rem",
                        }}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* â”€â”€ Teacher search + carousel â”€â”€ */}
                <div className="mb-4">
                  <h5 className="mb-2">Maestros Disponibles</h5>
                  <p className="text-muted small mb-3">Buscar Maestro</p>
                  <div className="position-relative mb-3">
                    <Search
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: "0.75rem" }}
                      size={20}
                    />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => {
                        setTeacherSearch(e.target.value);
                        setTeacherStartIndex(0);
                      }}
                      placeholder="Escribe el nombre del maestro"
                      className="form-control ps-5"
                      style={{
                        paddingRight: teacherSearch ? "2.5rem" : "1rem",
                      }}
                    />
                    {teacherSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherSearch("");
                          setTeacherStartIndex(0);
                        }}
                        className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1"
                        style={{ border: "none", background: "none" }}
                      >
                        <X size={20} className="text-muted" />
                      </button>
                    )}
                  </div>

                  {loadingTeachers ? (
                    <LoadingSpinner message="Cargando maestros..." />
                  ) : filteredTeachers.length === 0 ? (
                    <div className="text-center py-4">
                      <Search size={32} className="text-muted mb-2" />
                      <p className="text-muted">No se encontraron maestros.</p>
                    </div>
                  ) : (
                    <div className="position-relative px-4">
                      <button
                        onClick={() =>
                          setTeacherStartIndex(
                            teacherStartIndex - TEACHERS_PER_PAGE,
                          )
                        }
                        className="btn btn-light position-absolute top-50 translate-middle-y"
                        style={{ left: "-0.5rem", zIndex: 10 }}
                        disabled={!canGoBack}
                      >
                        <ChevronLeft size={24} />
                      </button>

                      <div className="row g-3">
                        {visibleTeachers.map((t) => {
                          const isSelected =
                            selectedTeacher?.idUsuario === t.idUsuario;
                          return (
                            <div
                              key={t.idUsuario}
                              className="col-12 col-md-6 col-lg-3"
                            >
                              <button
                                onClick={() => {
                                  setSelectedTeacher(isSelected ? null : t);
                                  setSelectedSlot(null);
                                  setSelectedSlotDate(null);
                                }}
                                className={`btn w-100 text-start p-3 ${isSelected ? "btn-primary" : "btn-outline-secondary"}`}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{
                                      width: "3rem",
                                      height: "3rem",
                                      fontSize: "0.875rem",
                                      backgroundColor: isSelected
                                        ? "rgba(255,255,255,0.2)"
                                        : "#e9ecef",
                                      color: isSelected ? "#fff" : "#495057",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {getInitials(t.nombres, t.apellidos)}
                                  </div>
                                  <div className="flex-grow-1 overflow-hidden">
                                    <p className="mb-0 small fw-semibold text-truncate">
                                      Prof. {t.nombres} {t.apellidos}
                                    </p>
                                    <small
                                      className={
                                        isSelected
                                          ? "text-white-50"
                                          : "text-muted"
                                      }
                                    >
                                      {isSelected
                                        ? "Seleccionado"
                                        : "Ver horarios"}
                                    </small>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                      {renderRatingStars(t.ratingPromedio)}
                                      <small
                                        className={
                                          isSelected
                                            ? "text-white-50"
                                            : "text-muted"
                                        }
                                      >
                                        ({t.ratingTotal ?? 0})
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() =>
                          setTeacherStartIndex(
                            teacherStartIndex + TEACHERS_PER_PAGE,
                          )
                        }
                        className="btn btn-light position-absolute top-50 translate-middle-y"
                        style={{ right: "-0.5rem", zIndex: 10 }}
                        disabled={!canGoForward}
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  )}
                </div>

                {/* â”€â”€ Weekly calendar grid (nuevo diseño) â”€â”€ */}
                <div className="mb-4">
                  {/* Section header */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <CalendarIcon size={20} className="text-primary" />
                      <h5 className="mb-0">Horarios Disponibles</h5>
                    </div>
                    <span className="text-muted small">
                      Horario: 7:00 AM - 8:00 PM
                    </span>
                  </div>

                  {/* Week nav â€” arrows far left/right, title centered */}
                  <div
                    className="position-relative d-flex align-items-center justify-content-center mb-3"
                    style={{ minHeight: "56px" }}
                  >
                    <button
                      className="btn btn-light position-absolute start-0"
                      onClick={prevWeek}
                      style={{ zIndex: 1 }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {weekLabel}
                      </div>
                      <div className="text-muted small">{weekRange}</div>
                    </div>
                    <button
                      className="btn btn-light position-absolute end-0"
                      onClick={nextWeek}
                      style={{ zIndex: 1 }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {loadingWeekSlots ? (
                    <div className="py-4">
                      <LoadingSpinner message="Cargando horarios..." />
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "separate",
                          borderSpacing: 0,
                          minWidth: "760px",
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ width: "64px" }} />
                            {weekDays.map((dayISO, i) => {
                              const [, , dayNum] = dayISO.split("-");
                              const isToday = dayISO === todayISO;
                              return (
                                <th
                                  key={dayISO}
                                  className="text-center pb-3"
                                  style={{ fontWeight: 500, minWidth: "110px" }}
                                >
                                  <div
                                    className="text-muted small"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    {DAY_NAMES[i]}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "1.1rem",
                                      color: isToday ? "#2563eb" : "#111",
                                      fontWeight: isToday ? 700 : 500,
                                    }}
                                  >
                                    {parseInt(dayNum, 10)}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {GRID_HOURS.map((hour) => (
                            <tr key={hour}>
                              <td
                                style={{
                                  verticalAlign: "middle",
                                  paddingTop: "4px",
                                  paddingBottom: "4px",
                                  paddingRight: "12px",
                                  whiteSpace: "nowrap",
                                  fontSize: "0.8rem",
                                  color: "#6b7280",
                                  textAlign: "right",
                                }}
                              >
                                {String(hour).padStart(2, "0")}:00
                              </td>
                              {weekDays.map((dayISO) => {
                                const slot = getSlotStartingAt(dayISO, hour);
                                const isSelected =
                                  selectedSlot?.idSlot === slot?.idSlot;
                                const isPast =
                                  dayISO < todayISO ||
                                  (dayISO === todayISO &&
                                    hour <= new Date().getHours());

                                const apellido = slot?.nombreMaestro
                                  ? slot.nombreMaestro.trim().split(/\s+/).pop()
                                  : "";
                                const isVirtual =
                                  slot?.modalidad !== "PRESENCIAL";

                                let cellBg = "#ffffff";
                                let cellBorder = "1px solid #d1d5db";
                                let iconColor = "#16a34a";
                                let textColor = "#16a34a";
                                let cursor = "default";

                                if (isSelected) {
                                  cellBg = "#dbeafe";
                                  cellBorder = "2px solid #2563eb";
                                  iconColor = "#2563eb";
                                  textColor = "#2563eb";
                                  cursor = "pointer";
                                } else if (slot && !slot.disponible) {
                                  cellBg = "#9ca3af";
                                  cellBorder = "1px solid #9ca3af";
                                  iconColor = "#ffffff";
                                  textColor = "#ffffff";
                                } else if (slot && slot.disponible && !isPast) {
                                  cellBg = "#ffffff";
                                  cellBorder = "1.5px solid #16a34a";
                                  cursor = "pointer";
                                }

                                return (
                                  <td
                                    key={dayISO}
                                    style={{
                                      padding: "3px",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "75px",
                                        backgroundColor: cellBg,
                                        border: cellBorder,
                                        borderRadius: "8px",
                                        cursor,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px",
                                        transition: "all 0.15s",
                                        overflow: "hidden",
                                      }}
                                      onClick={() => {
                                        if (!slot || !slot.disponible || isPast)
                                          return;
                                        setSelectedSlot(slot);
                                        setSelectedSlotDate(dayISO);
                                        setDuration(60);
                                        setDescripcion("");
                                        setBookingError("");
                                      }}
                                    >
                                      {slot && (
                                        <>
                                          {isVirtual ? (
                                            <Video
                                              size={16}
                                              color={iconColor}
                                            />
                                          ) : (
                                            <MapPin
                                              size={16}
                                              color={iconColor}
                                            />
                                          )}
                                          <span
                                            style={{
                                              fontSize: "0.78rem",
                                              color: textColor,
                                              fontWeight: 500,
                                              lineHeight: 1,
                                            }}
                                          >
                                            {apellido}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Legend */}
                  <div className="d-flex justify-content-center gap-4 mt-3">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          border: "1.5px solid #16a34a",
                          borderRadius: 3,
                          backgroundColor: "#fff",
                        }}
                      />
                      <small className="text-muted">Disponible</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          backgroundColor: "#9ca3af",
                        }}
                      />
                      <small className="text-muted">Ocupado</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid #2563eb",
                          borderRadius: 3,
                          backgroundColor: "#dbeafe",
                        }}
                      />
                      <small className="text-muted">Seleccionado</small>
                    </div>
                  </div>
                </div>

                {/* â”€â”€ Step 2: Booking form (appears after slot selection) â”€â”€ */}
                {selectedSlot && (
                  <div className="card shadow-sm border rounded-3 mt-3">
                    <div className="card-body p-4">
                      <h5 className="fw-bold mb-4 text-dark">
                        Configurar tu clase
                      </h5>

                      {/* Duration */}
                      <div className="mb-4">
                        <label className="form-label text-muted fw-semibold">
                          Duración de la clase
                        </label>
                        <div
                          className="d-flex gap-0"
                          style={{
                            border: "1px solid #dee2e6",
                            borderRadius: "0.5rem",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            type="button"
                            className="btn flex-fill d-flex flex-column align-items-center py-3"
                            style={{
                              borderRadius: 0,
                              backgroundColor:
                                duration === 40 ? "#dbeafe" : "#fff",
                              color: duration === 40 ? "#2563eb" : "#6c757d",
                              border: "none",
                              fontWeight: duration === 40 ? 600 : 400,
                            }}
                            onClick={() => setDuration(40)}
                          >
                            <Clock size={20} className="mb-1" />
                            <span>40 minutos</span>
                          </button>
                          <button
                            type="button"
                            className="btn flex-fill d-flex flex-column align-items-center py-3"
                            style={{
                              borderRadius: 0,
                              backgroundColor:
                                duration === 60 ? "#dbeafe" : "#fff",
                              color: duration === 60 ? "#2563eb" : "#6c757d",
                              border: "none",
                              borderLeft: "1px solid #dee2e6",
                              fontWeight: duration === 60 ? 600 : 400,
                            }}
                            onClick={() => setDuration(60)}
                          >
                            <Clock size={20} className="mb-1" />
                            <span>1 hora</span>
                          </button>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="mb-4">
                        <label className="form-label text-muted fw-semibold">
                          Descripción de la clase
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Ej: Práctica de conversación, gramática avanzada..."
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                        />
                      </div>

                      {bookingError && (
                        <div className="alert alert-danger py-2 mb-3">
                          {bookingError}
                        </div>
                      )}

                      {/* Info summary */}
                      <div
                        className="rounded p-3 mb-4"
                        style={{
                          backgroundColor: "#f8f9fa",
                          fontSize: "0.9rem",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Maestro:</span>
                          <strong className="text-dark">
                            {selectedTeacher?.nombres}{" "}
                            {selectedTeacher?.apellidos}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <span className="text-muted">Fecha:</span>
                          <strong className="text-dark">
                            {formatFecha(selectedSlotDate)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <span className="text-muted">Hora:</span>
                          <strong className="text-dark">
                            {formatHora(selectedSlot.horaInicio)} –{" "}
                            {formatHora(selectedSlot.horaFin)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <span className="text-muted">Modalidad:</span>
                          <strong className="text-dark">
                            {formatModalidad(selectedSlot.modalidad)}
                          </strong>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className="btn btn-outline-secondary flex-fill"
                          onClick={cancelBooking}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary flex-fill fw-semibold"
                          onClick={handleBook}
                          disabled={booking}
                        >
                          {booking ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                aria-hidden="true"
                              />
                              Reservando...
                            </>
                          ) : (
                            "Continuar"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* â•â• HISTORIAL TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === "history" && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-1">Historial de Clases</h5>
                  <p className="text-muted small mb-0">
                    Visualiza el historial de tus clases y califica a tus
                    profesores
                  </p>
                </div>

                {actionError && (
                  <div className="alert alert-danger py-2 mb-3">
                    {actionError}
                  </div>
                )}
                {actionSuccess && (
                  <div className="alert alert-success py-2 mb-3">
                    {actionSuccess}
                  </div>
                )}

                {loadingAppointments ? (
                  <LoadingSpinner message="Cargando tus citas..." />
                ) : appointments.length === 0 ? (
                  <div className="text-center py-5">
                    <CalendarIcon size={64} className="text-muted mb-3" />
                    <p className="text-muted">No tienes clases registradas.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Profesor</th>
                            <th>Fecha</th>
                            <th>Hora de inicio</th>
                            <th>Duración</th>
                            <th>Modalidad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedAppointments.map((apt) => {
                            const { label, badgeClass } = estadoBadge(
                              apt.estado,
                            );
                            const dateISO = apt.horaInicio?.split("T")[0] ?? "";
                            const timeStr =
                              apt.horaInicio?.split("T")[1] ??
                              apt.horaInicio ??
                              "";
                            // day-of-week label
                            const dayLabel = dateISO
                              ? new Date(
                                  dateISO + "T00:00:00",
                                ).toLocaleDateString("es-MX", {
                                  weekday: "long",
                                })
                              : "";
                            // date digits only e.g. "26/01/2026"
                            const dateShort = dateISO
                              ? new Date(
                                  dateISO + "T00:00:00",
                                ).toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : "—";
                            const isVirtual = apt.modalidad === "VIRTUAL";
                            return (
                              <tr key={apt.idCita}>
                                <td className="fw-medium">
                                  Prof. {apt.nombreMaestro}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  <div>{dateShort}</div>
                                  <small className="text-muted">
                                    {dayLabel}
                                  </small>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  {formatHora(timeStr)}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  {apt.duracion ? `${apt.duracion} min` : "—"}
                                </td>
                                <td>
                                  <span
                                    className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
                                    style={{
                                      backgroundColor: isVirtual
                                        ? "#1d4ed8"
                                        : "#0891b2",
                                      color: "#fff",
                                      borderRadius: "999px",
                                      fontSize: "0.75rem",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {isVirtual ? (
                                      <Video size={12} />
                                    ) : (
                                      <MapPin size={12} />
                                    )}
                                    {isVirtual ? "Virtual" : "Presencial"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${badgeClass}`}
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {label}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setViewingApt(apt)}
                                  >
                                    Ver
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalHistPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          onClick={() => setHistPage(histPage - 1)}
                          disabled={histPage === 1}
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        >
                          <ChevronLeft size={20} /> Anterior
                        </button>
                        <small className="text-muted">
                          Mostrando {(histPage - 1) * ITEMS_PER_PAGE + 1}–
                          {Math.min(
                            histPage * ITEMS_PER_PAGE,
                            appointments.length,
                          )}{" "}
                          de {appointments.length}
                        </small>
                        <button
                          onClick={() => setHistPage(histPage + 1)}
                          disabled={histPage === totalHistPages}
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        >
                          Siguiente <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* â”€â”€ Appointment Details Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {viewingApt && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles de la Clase</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingApt(null)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="text-muted small">Maestro</label>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded mt-1">
                    <div
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: "3rem",
                        height: "3rem",
                        fontSize: "0.875rem",
                        flexShrink: 0,
                      }}
                    >
                      {viewingApt.nombreMaestro
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="mb-0 fw-semibold">
                        {viewingApt.nombreMaestro}
                      </p>
                      <small className="text-muted">Maestro</small>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Fecha</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <p className="mb-0">
                        {formatFecha(viewingApt.horaInicio?.split("T")[0])}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Horario</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <p className="mb-0">
                        {formatHora(
                          viewingApt.horaInicio?.split("T")[1] ??
                            viewingApt.horaInicio,
                        )}
                        {" – "}
                        {formatHora(
                          viewingApt.horaFin?.split("T")[1] ??
                            viewingApt.horaFin,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Modalidad</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <span
                        className={`badge ${viewingApt.modalidad === "PRESENCIAL" ? "badge-presencial" : "badge-virtual"}`}
                      >
                        {viewingApt.modalidad === "VIRTUAL" ? (
                          <>
                            <Video size={14} className="me-1" />
                            Virtual
                          </>
                        ) : (
                          <>
                            <MapPin size={14} className="me-1" />
                            Presencial
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Estado</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <span
                        className={`badge ${estadoBadge(viewingApt.estado).badgeClass}`}
                      >
                        {estadoBadge(viewingApt.estado).label}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingApt.descripcionClase && (
                  <div className="mb-3">
                    <label className="text-muted small">Descripción</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <p className="mb-0">{viewingApt.descripcionClase}</p>
                    </div>
                  </div>
                )}

                {/* Link Meet â€” VIRTUAL */}
                {viewingApt.modalidad === "VIRTUAL" && viewingApt.linkMeet && (
                  <div className="mb-3">
                    <label className="text-muted small">Link de la clase</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <a
                        href={viewingApt.linkMeet}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary"
                      >
                        {viewingApt.linkMeet}
                      </a>
                    </div>
                  </div>
                )}

                {/* QR Code â€” PRESENCIAL */}
                {viewingApt.modalidad === "PRESENCIAL" &&
                  viewingApt.codigoQr && (
                    <div className="mb-3">
                      <label className="text-muted small">
                        Código QR de asistencia
                      </label>
                      <div className="p-3 bg-light rounded mt-1 text-center">
                        <img
                          src={`data:image/png;base64,${viewingApt.codigoQr}`}
                          alt="QR"
                          style={{ maxWidth: "180px", cursor: "pointer" }}
                          title="Haz clic para ampliar"
                          onClick={() => openQrInNewTab(viewingApt.codigoQr)}
                        />
                      </div>
                    </div>
                  )}
              </div>
              <div className="modal-footer">
                {viewingApt?.estado?.toUpperCase() === "COMPLETADA" && (
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2 me-auto"
                    onClick={() => openRatingModal(viewingApt)}
                  >
                    <Star size={16} /> Calificar Maestro
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setViewingApt(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && ratingApt && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Calificar Maestro</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRatingModal}
                />
              </div>
              <div className="modal-body">
                <p className="mb-2 text-muted">{ratingApt.nombreMaestro}</p>

                <label className="form-label">Calificación</label>
                <div className="d-flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="btn p-0 border-0 bg-transparent"
                      onClick={() => !alreadyRated && setRatingStars(value)}
                      disabled={alreadyRated}
                    >
                      <Star
                        size={34}
                        color={value <= ratingStars ? "#facc15" : "#6c757d"}
                        fill={value <= ratingStars ? "#facc15" : "none"}
                      />
                    </button>
                  ))}
                </div>

                <label className="form-label">
                  ¿El maestro asistió a la clase?
                </label>
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${ratingAsistio ? "btn-success" : "btn-outline-secondary"}`}
                    onClick={() => !alreadyRated && setRatingAsistio(true)}
                    disabled={alreadyRated}
                  >
                    <Check size={18} /> Sí Asistió
                  </button>
                  <button
                    type="button"
                    className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${!ratingAsistio ? "btn-secondary" : "btn-outline-secondary"}`}
                    onClick={() => !alreadyRated && setRatingAsistio(false)}
                    disabled={alreadyRated}
                  >
                    <X size={18} /> No Asistió
                  </button>
                </div>

                <div className="mb-2">
                  <label className="form-label">Comentario (opcional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    maxLength={500}
                    value={ratingComentario}
                    onChange={(e) => setRatingComentario(e.target.value)}
                    disabled={alreadyRated}
                  />
                </div>

                {ratingError && (
                  <div className="alert alert-danger py-2 mt-2">
                    {ratingError}
                  </div>
                )}
                {ratingSuccess && (
                  <div className="alert alert-success py-2 mt-2">
                    {ratingSuccess}
                  </div>
                )}
                {alreadyRated && (
                  <div className="alert alert-info py-2 mt-2 mb-0">
                    Ya calificaste esta clase.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={closeRatingModal}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveRating}
                  disabled={ratingSaving || alreadyRated}
                >
                  {ratingSaving ? "Guardando..." : "Guardar Calificación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Reschedule Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {rescheduling && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reagendar Cita</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRescheduling(null)}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                  Maestro: <strong>{rescheduling.nombreMaestro}</strong>
                </p>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nueva fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    min={todayISO}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
                {rescheduleDate &&
                  (loadingRescheduleSlots ? (
                    <LoadingSpinner message="Cargando horarios..." />
                  ) : rescheduleSlots.length === 0 ? (
                    <p className="text-muted">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  ) : (
                    <div>
                      <label className="form-label fw-semibold">
                        Nuevo horario
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {rescheduleSlots.map((s) => (
                          <button
                            key={s.idSlot}
                            className={`btn ${newSlotId === s.idSlot ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setNewSlotId(s.idSlot)}
                          >
                            {formatHora(s.horaInicio)} â€“ {formatHora(s.horaFin)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setRescheduling(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newSlotId || saving}
                  onClick={handleReschedule}
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Guardando...
                    </>
                  ) : (
                    "Confirmar Reagenda"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        autoClose
      />
    </div>
  );
}
