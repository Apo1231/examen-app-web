import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { createSlot, deleteSlot, getMySlots } from '../../api/slots.api'
import { createRating, getMyRatingByAppointment, getTeacherAppointments } from '../../api/appointments.api'
import LoadingSpinner from '../../components/LoadingSpinner'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import {
  LogOut, User, Filter, Video, MapPin, Save,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star, Check, X,
} from 'lucide-react'
import { formatFecha, formatHora, formatModalidad, estadoBadge, extractErrorMessage } from '../../utils/formatters'
import { getMondayOf, toLocalISO, DAY_NAMES, MONTH_NAMES, openQrInNewTab } from '../../utils/dateHelpers'

const ITEMS_PER_PAGE = 10
const SLOTS_PER_PAGE = 10

// Initial slot form â€” ubicacion included so it's sent in the POST body
const INITIAL_FORM = { horaInicio: '', horaFin: '', modalidad: 'VIRTUAL', ubicacion: '' }

// Time options for dropdowns (07:00 â€“ 21:00, 1-hour steps)
const TIME_OPTIONS = []
for (let h = 7; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
}

/** Returns a long Spanish date label, e.g. "miércoles, 11 de marzo" */
function toLongLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function MaestroDashboard() {
  const { user, logout } = useAuth()

  // â”€â”€ Header UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // â”€â”€ Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeTab, setActiveTab] = useState('schedule')

  // â”€â”€ 7-day calendar (Horarios) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [selectedDay, setSelectedDay] = useState(null) // YYYY-MM-DD or null
  const [slotsPage, setSlotsPage] = useState(1)

  // â”€â”€ Horarios tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [form, setForm] = useState(INITIAL_FORM)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // â”€â”€ Historial tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [appointments, setAppointments] = useState([])
  const [loadingApts, setLoadingApts] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalityFilter, setModalityFilter] = useState('all')
  const [histPage, setHistPage] = useState(1)
  const [viewingApt, setViewingApt] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingApt, setRatingApt] = useState(null)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingAsistio, setRatingAsistio] = useState(true)
  const [ratingComentario, setRatingComentario] = useState('')
  const [ratingSaving, setRatingSaving] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [ratingSuccess, setRatingSuccess] = useState('')
  const [alreadyRated, setAlreadyRated] = useState(false)

  // â”€â”€ Today string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const todayISO = toLocalISO(new Date())

  // â”€â”€ Load slots on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadSlots = () => {
    setLoadingSlots(true)
    getMySlots()
      .then((res) => setSlots(res.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }

  useEffect(() => { loadSlots() }, [])

  // â”€â”€ Load appointments on mount (auto, not lazy) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    setLoadingApts(true)
    getTeacherAppointments()
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoadingApts(false))
  }, [])

  // â”€â”€ Week navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return toLocalISO(d)
  })

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
    setSelectedDay(null)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
    setSelectedDay(null)
  }

  const monthLabel = (() => {
    // Use the Wednesday of the week for the month label (middle of week)
    const mid = new Date(weekStart)
    mid.setDate(mid.getDate() + 3)
    return `${MONTH_NAMES[mid.getMonth()]} De ${mid.getFullYear()}`
  })()

  // â”€â”€ Slot form handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
    setFormSuccess('')
  }

  const setModalidad = (value) => {
    setForm({ ...form, modalidad: value, ubicacion: value === 'VIRTUAL' ? '' : form.ubicacion })
    setFormError('')
    setFormSuccess('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!selectedDay) {
      setFormError('Selecciona un día en el calendario primero')
      return
    }
    if (!form.horaInicio || !form.horaFin) {
      setFormError('Selecciona la hora de inicio y fin')
      return
    }
    if (form.horaInicio >= form.horaFin) {
      setFormError('La hora de inicio debe ser antes de la hora de fin')
      return
    }

    // If creating slots for today, reject if horaInicio is already past
    if (selectedDay === todayISO) {
      const startH = parseInt(form.horaInicio.split(':')[0], 10)
      if (startH <= new Date().getHours()) {
        setFormError('La hora de inicio ya pasó. Elige una hora futura.')
        return
      }
    }

    // Build one slot per full hour within the chosen range.
    // e.g. 09:00 → 12:00  produces  09:00–10:00, 10:00–11:00, 11:00–12:00
    const startH = parseInt(form.horaInicio.split(':')[0], 10)
    const endH   = parseInt(form.horaFin.split(':')[0],   10)
    if (endH - startH < 1) {
      setFormError('El rango debe ser de al menos 1 hora completa')
      return
    }

    const hourSlots = []
    for (let h = startH; h < endH; h++) {
      hourSlots.push({
        fecha:      selectedDay,
        horaInicio: `${String(h).padStart(2, '0')}:00`,
        horaFin:    `${String(h + 1).padStart(2, '0')}:00`,
        modalidad:  form.modalidad,
        ubicacion:  form.ubicacion,
      })
    }

    setCreating(true)
    setFormError('')
    setFormSuccess('')
    try {
      await Promise.all(hourSlots.map((s) => createSlot(s)))
      const count = hourSlots.length
      setFormSuccess(
        count === 1
          ? 'Horario guardado exitosamente.'
          : `${count} horarios de 1 hora guardados exitosamente.`
      )
      setForm(INITIAL_FORM)
      loadSlots()
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Error al crear slot'))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteError('')
    try {
      await deleteSlot(id)
      loadSlots()
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Error al eliminar'))
    }
  }

  // â”€â”€ Slots for the selected day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const slotsForDay = selectedDay
    ? slots.filter((s) => s.fecha === selectedDay)
    : []

  const totalSlotsPages = Math.max(1, Math.ceil(slotsForDay.length / SLOTS_PER_PAGE))
  const pagedSlotsForDay = slotsForDay.slice((slotsPage - 1) * SLOTS_PER_PAGE, slotsPage * SLOTS_PER_PAGE)

  // â”€â”€ Historial filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredApts = appointments.filter((apt) => {
    const aptDate = apt.horaInicio?.split('T')[0] ?? ''
    const matchDate = dateFilter === '' || aptDate === dateFilter
    const matchStatus = statusFilter === 'all' || apt.estado?.toUpperCase() === statusFilter.toUpperCase()
    const matchModality = modalityFilter === 'all' || apt.modalidad === modalityFilter
    return matchDate && matchStatus && matchModality
  })

  const totalHistPages = Math.max(1, Math.ceil(filteredApts.length / ITEMS_PER_PAGE))
  const pagedApts = filteredApts.slice((histPage - 1) * ITEMS_PER_PAGE, histPage * ITEMS_PER_PAGE)

  const resetFilters = () => {
    setDateFilter('')
    setStatusFilter('all')
    setModalityFilter('all')
    setHistPage(1)
  }

  const hasFilters = dateFilter !== '' || statusFilter !== 'all' || modalityFilter !== 'all'

  useEffect(() => {
    setSlotsPage(1)
  }, [selectedDay])

  const openRatingModal = async (apt) => {
    setRatingApt(apt)
    setRatingStars(0)
    setRatingAsistio(true)
    setRatingComentario('')
    setRatingError('')
    setRatingSuccess('')
    setAlreadyRated(false)
    setShowRatingModal(true)

    try {
      const existing = await getMyRatingByAppointment(apt.idCita)
      if (existing) {
        setAlreadyRated(true)
        setRatingStars(existing.estrellas ?? 0)
        setRatingAsistio(existing.asistio ?? true)
        setRatingComentario(existing.comentario ?? '')
      }
    } catch (err) {
      setRatingError(extractErrorMessage(err, 'No se pudo verificar la calificación'))
    }
  }

  const closeRatingModal = () => {
    setShowRatingModal(false)
    setRatingApt(null)
    setRatingStars(0)
    setRatingAsistio(true)
    setRatingComentario('')
    setRatingError('')
    setRatingSuccess('')
    setAlreadyRated(false)
  }

  const handleSaveRating = async () => {
    if (!ratingApt || alreadyRated) return
    if (ratingStars < 1 || ratingStars > 5) {
      setRatingError('Selecciona una calificación de 1 a 5 estrellas.')
      return
    }

    setRatingSaving(true)
    setRatingError('')
    setRatingSuccess('')
    try {
      await createRating(ratingApt.idCita, {
        estrellas: ratingStars,
        asistio: ratingAsistio,
        comentario: ratingComentario?.trim() || undefined,
      })
      setRatingSuccess('Calificación guardada correctamente.')
      setAlreadyRated(true)
    } catch (err) {
      setRatingError(extractErrorMessage(err, 'No se pudo guardar la calificación'))
    } finally {
      setRatingSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-light">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="bg-white border-bottom shadow-sm sticky-top">
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
                  className="btn btn-light"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User size={20} />
                </button>
                {showUserMenu && (
                  <div
                    className="dropdown-menu show shadow"
                    style={{ right: 0, left: 'auto', minWidth: 200 }}
                  >
                    <div className="dropdown-header">
                      <small className="text-muted">{user?.nombres} {user?.apellidos}</small>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => { setShowUserMenu(false); setShowPasswordModal(true) }}>
                      Cambiar Contraseña
                    </button>
                  </div>
                )}
              </div>

              <button
                className="btn btn-light d-flex align-items-center gap-2"
                onClick={logout}
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
          <h2 className="h3 mb-1">Bienvenida, Prof. {user?.nombres} {user?.apellidos}</h2>
          <p className="text-muted mb-0">Gestiona tus horarios y visualiza tus citas</p>
        </div>

        {/* Tabs card */}
        <div className="card shadow-sm">
          <div className="card-header bg-white border-bottom">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Gestión de Horarios
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  Historial de Citas
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">

            {/* â•â• Gestión de Horarios â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'schedule' && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-1">Configurar Disponibilidad</h5>
                  <p style={{ color: '#dc6803' }} className="small mb-0">
                    Selecciona un día en el calendario y configura tus horarios disponibles
                  </p>
                </div>

                {/* â”€â”€ 7-day mini calendar â”€â”€ */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <button className="btn btn-light btn-sm" onClick={prevWeek}>
                    <ChevronLeft size={18} />
                  </button>
                  <span className="fw-semibold">{monthLabel}</span>
                  <button className="btn btn-light btn-sm" onClick={nextWeek}>
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="row g-2 mb-4">
                  {weekDays.map((dayISO, i) => {
                    const [, , dayNum] = dayISO.split('-')
                    const isSelected = selectedDay === dayISO
                    const isToday = dayISO === todayISO
                    const isPast = dayISO < todayISO
                    return (
                      <div key={dayISO} className="col">
                        <button
                          className={`btn w-100 py-3 d-flex flex-column align-items-center border ${
                            isSelected
                              ? 'btn-primary text-white'
                              : isPast
                              ? 'btn-white bg-white'
                              : 'btn-white bg-white'
                          }`}
                          style={{
                            borderRadius: '0.5rem',
                            opacity: isPast ? 0.4 : 1,
                            cursor: isPast ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isPast}
                          onClick={() => {
                            setSelectedDay(isSelected ? null : dayISO)
                            setForm(INITIAL_FORM)
                            setFormError('')
                            setFormSuccess('')
                          }}
                        >
                          <small
                            className="mb-1"
                            style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#6b7280', fontSize: '0.75rem' }}
                          >
                            {DAY_NAMES[i]}
                          </small>
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: '1.1rem',
                              color: isSelected ? '#fff' : isToday ? '#2563eb' : '#111',
                            }}
                          >
                            {parseInt(dayNum, 10)}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* No day selected â€” instruction banner */}
                {!selectedDay && (
                  <div
                    className="alert mb-0"
                    style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
                  >
                    <strong>Instrucciones:</strong> Selecciona un día en el calendario para configurar tus
                    horarios disponibles. Los alumnos podrán ver y agendar citas en los horarios que definas.
                  </div>
                )}

                {/* Day selected â€” form + slots for that day */}
                {selectedDay && (
                  <div>
                    {/* Slot creation form */}
                    <div
                      className="card mb-4"
                      style={{ border: '1px solid #2563eb', borderRadius: '0.5rem' }}
                    >
                      <div className="card-body">
                        <h6 className="fw-semibold mb-1">
                          Configurar horario para {toLongLabel(selectedDay)}
                        </h6>
                        <p className="text-muted small mb-3">
                          Define el rango de horas disponibles. Se creará un slot de 1 hora por cada hora dentro del rango.
                        </p>

                        {formError && <div className="alert alert-danger py-2">{formError}</div>}
                        {formSuccess && <div className="alert alert-success py-2">{formSuccess}</div>}

                        <form onSubmit={handleCreate} noValidate>
                          {/* Time row */}
                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label" style={{ color: '#dc6803' }}>Hora de inicio</label>
                              <select
                                name="horaInicio"
                                className="form-select"
                                value={form.horaInicio}
                                onChange={handleFormChange}
                                required
                              >
                                <option value="">Seleccionar...</option>
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label" style={{ color: '#dc6803' }}>Hora de fin</label>
                              <select
                                name="horaFin"
                                className="form-select"
                                value={form.horaFin}
                                onChange={handleFormChange}
                                required
                              >
                                <option value="">Seleccionar...</option>
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Modalidad toggle */}
                          <div className="mb-3">
                            <label className="form-label" style={{ color: '#dc6803' }}>Modalidad</label>
                            <div className="d-flex gap-0" style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #dee2e6' }}>
                              <button
                                type="button"
                                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${
                                  form.modalidad === 'VIRTUAL' ? 'btn-primary' : 'btn-white bg-white'
                                }`}
                                style={{ borderRadius: 0 }}
                                onClick={() => setModalidad('VIRTUAL')}
                              >
                                <Video size={16} />
                                Virtual
                              </button>
                              <button
                                type="button"
                                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${
                                  form.modalidad === 'PRESENCIAL' ? 'btn-primary' : 'btn-white bg-white'
                                }`}
                                style={{ borderRadius: 0 }}
                                onClick={() => setModalidad('PRESENCIAL')}
                              >
                                <MapPin size={16} />
                                Presencial
                              </button>
                            </div>
                          </div>

                          {/* Ubicación â€” only for PRESENCIAL */}
                          {form.modalidad === 'PRESENCIAL' && (
                            <div className="mb-3">
                              <label className="form-label" style={{ color: '#dc6803' }}>
                                Ubicación (Salón/Edificio)
                              </label>
                              <input
                                type="text"
                                name="ubicacion"
                                className="form-control"
                                placeholder="Ej: Aula 201, Edificio B"
                                value={form.ubicacion}
                                onChange={handleFormChange}
                              />
                            </div>
                          )}

                          {/* Actions */}
                          <div className="d-flex justify-content-end gap-2 mt-3">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSelectedDay(null)
                                setForm(INITIAL_FORM)
                                setFormError('')
                                setFormSuccess('')
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary d-flex align-items-center gap-2"
                              disabled={creating}
                            >
                              {creating ? (
                                <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Guardando...</>
                              ) : (
                                <><Save size={16} /> Guardar Horario</>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Slots for selected day */}
                    {deleteError && <div className="alert alert-danger py-2 mb-3">{deleteError}</div>}

                    {loadingSlots ? (
                      <LoadingSpinner message="Cargando horarios..." />
                    ) : slotsForDay.length === 0 ? (
                      <div className="text-center py-4">
                        <CalendarIcon size={36} className="text-muted mb-2" />
                        <p className="text-muted small mb-0">No hay horarios para este día.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Hora inicio</th>
                              <th>Hora fin</th>
                              <th>Modalidad</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedSlotsForDay.map((slot) => (
                              <tr key={slot.idSlot}>
                                <td>{formatHora(slot.horaInicio)}</td>
                                <td>{formatHora(slot.horaFin)}</td>
                                <td>
                                  <span className={`badge ${slot.modalidad === 'PRESENCIAL' ? 'badge-presencial' : 'badge-virtual'}`}>
                                    {slot.modalidad === 'VIRTUAL' ? (
                                      <><Video size={11} className="me-1" />Virtual</>
                                    ) : (
                                      <><MapPin size={11} className="me-1" />Presencial</>
                                    )}
                                  </span>
                                </td>
                                <td>
                                  {slot.disponible ? (
                                    <span className="badge bg-success">Disponible</span>
                                  ) : (
                                    <span className="badge bg-secondary">Ocupado</span>
                                  )}
                                </td>
                                <td>
                                  {slot.disponible && (
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => handleDelete(slot.idSlot)}
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {slotsForDay.length > 0 && totalSlotsPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setSlotsPage(slotsPage - 1)}
                          disabled={slotsPage === 1}
                        >
                          <ChevronLeft size={18} /> Anterior
                        </button>
                        <small className="text-muted">Página {slotsPage} de {totalSlotsPages}</small>
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setSlotsPage(slotsPage + 1)}
                          disabled={slotsPage === totalSlotsPages}
                        >
                          Siguiente <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* â•â• Historial de Citas â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'appointments' && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-1">Historial de Citas</h5>
                  <p className="text-muted small mb-0">Visualiza y filtra el historial de tus clases</p>
                </div>

                {/* Filters */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <Filter size={20} />
                      <h6 className="mb-0">Filtros</h6>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Fecha</label>
                        <input
                          type="date"
                          className="form-control"
                          value={dateFilter}
                          onChange={(e) => { setDateFilter(e.target.value); setHistPage(1) }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Estado</label>
                        <select
                          className="form-select"
                          value={statusFilter}
                          onChange={(e) => { setStatusFilter(e.target.value); setHistPage(1) }}
                        >
                          <option value="all">Todos los estados</option>
                          <option value="AGENDADA">Agendada</option>
                          <option value="REAGENDADA">Reagendada</option>
                          <option value="CANCELADA">Cancelada</option>
                          <option value="COMPLETADA">Impartida</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Modalidad</label>
                        <select
                          className="form-select"
                          value={modalityFilter}
                          onChange={(e) => { setModalityFilter(e.target.value); setHistPage(1) }}
                        >
                          <option value="all">Todas</option>
                          <option value="VIRTUAL">Virtual</option>
                          <option value="PRESENCIAL">Presencial</option>
                        </select>
                      </div>
                    </div>
                    {hasFilters && (
                      <div className="mt-3">
                        <button className="btn btn-link p-0 text-decoration-none" onClick={resetFilters}>
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {loadingApts ? (
                  <LoadingSpinner message="Cargando citas..." />
                ) : filteredApts.length === 0 ? (
                  <div className="text-center py-5">
                    <CalendarIcon size={48} className="text-muted mb-3" />
                    <p className="text-muted">
                      {hasFilters
                        ? 'No se encontraron citas con los filtros seleccionados.'
                        : 'No tienes citas registradas.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Alumno</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Modalidad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedApts.map((apt) => {
                            const { label, badgeClass } = estadoBadge(apt.estado)
                            const aptDate = apt.horaInicio?.split('T')[0]
                            const aptTime = apt.horaInicio?.split('T')[1] ?? apt.horaInicio
                            return (
                              <tr key={apt.idCita}>
                                <td>{apt.nombreAlumno}</td>
                                <td>{formatFecha(aptDate)}</td>
                                <td>{formatHora(aptTime)}</td>
                                <td>
                                  <span className={`badge ${apt.modalidad === 'PRESENCIAL' ? 'badge-presencial' : 'badge-virtual'}`}>
                                    {apt.modalidad === 'VIRTUAL' ? (
                                      <><Video size={11} className="me-1" />Virtual</>
                                    ) : (
                                      <><MapPin size={11} className="me-1" />Presencial</>
                                    )}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${badgeClass}`}>{label}</span>
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
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalHistPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setHistPage(histPage - 1)}
                          disabled={histPage === 1}
                        >
                          <ChevronLeft size={18} /> Anterior
                        </button>
                        <small className="text-muted">Página {histPage} de {totalHistPages}</small>
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setHistPage(histPage + 1)}
                          disabled={histPage === totalHistPages}
                        >
                          Siguiente <ChevronRight size={18} />
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
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles de la Clase</h5>
                <button type="button" className="btn-close" onClick={() => setViewingApt(null)} />
              </div>
              <div className="modal-body">

                {/* Alumno */}
                <div className="mb-3">
                  <label className="text-muted small">Alumno</label>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded mt-1">
                    <div
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.85rem', flexShrink: 0 }}
                    >
                      {viewingApt.nombreAlumno?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="mb-0 fw-semibold">{viewingApt.nombreAlumno}</p>
                      <small className="text-muted">Estudiante</small>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Fecha</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <p className="mb-0">{formatFecha(viewingApt.horaInicio?.split('T')[0])}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Horario</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <p className="mb-0">
                        {formatHora(viewingApt.horaInicio?.split('T')[1] ?? viewingApt.horaInicio)}
                        {' – '}
                        {formatHora(viewingApt.horaFin?.split('T')[1] ?? viewingApt.horaFin)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Modalidad</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <span className={`badge ${viewingApt.modalidad === 'PRESENCIAL' ? 'badge-presencial' : 'badge-virtual'}`}>
                        {formatModalidad(viewingApt.modalidad)}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Estado</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <span className={`badge ${estadoBadge(viewingApt.estado).badgeClass}`}>
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
                {viewingApt.modalidad === 'VIRTUAL' && viewingApt.linkMeet && (
                  <div className="mb-3">
                    <label className="text-muted small">Link de la clase</label>
                    <div className="p-3 bg-light rounded mt-1">
                      <a href={viewingApt.linkMeet} target="_blank" rel="noreferrer" className="text-primary">
                        {viewingApt.linkMeet}
                      </a>
                    </div>
                  </div>
                )}

                {/* QR Code â€” PRESENCIAL */}
                {viewingApt.modalidad === 'PRESENCIAL' && viewingApt.codigoQr && (
                  <div className="mb-3">
                    <label className="text-muted small">Código QR de la clase</label>
                    <div className="p-3 bg-light rounded mt-1 text-center">
                      <img
                        src={`data:image/png;base64,${viewingApt.codigoQr}`}
                        alt="Código QR"
                        style={{ maxWidth: '200px', cursor: 'pointer' }}
                        title="Haz clic para ampliar"
                         onClick={() => openQrInNewTab(viewingApt.codigoQr)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {viewingApt?.estado?.toUpperCase() === 'COMPLETADA' && (
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2 me-auto"
                    onClick={() => openRatingModal(viewingApt)}
                  >
                    <Star size={16} /> Calificar Alumno
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setViewingApt(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && ratingApt && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Calificar Alumno</h5>
                <button type="button" className="btn-close" onClick={closeRatingModal} />
              </div>
              <div className="modal-body">
                <p className="mb-2 text-muted">{ratingApt.nombreAlumno}</p>

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
                        color={value <= ratingStars ? '#facc15' : '#6c757d'}
                        fill={value <= ratingStars ? '#facc15' : 'none'}
                      />
                    </button>
                  ))}
                </div>

                <label className="form-label">¿El alumno asistió a la clase?</label>
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${ratingAsistio ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => !alreadyRated && setRatingAsistio(true)}
                    disabled={alreadyRated}
                  >
                    <Check size={18} /> Sí Asistió
                  </button>
                  <button
                    type="button"
                    className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${!ratingAsistio ? 'btn-secondary' : 'btn-outline-secondary'}`}
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

                {ratingError && <div className="alert alert-danger py-2 mt-2">{ratingError}</div>}
                {ratingSuccess && <div className="alert alert-success py-2 mt-2">{ratingSuccess}</div>}
                {alreadyRated && <div className="alert alert-info py-2 mt-2 mb-0">Ya calificaste esta clase.</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeRatingModal}>Cancelar</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveRating}
                  disabled={ratingSaving || alreadyRated}
                >
                  {ratingSaving ? 'Guardando...' : 'Guardar Calificación'}
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
  )
}
