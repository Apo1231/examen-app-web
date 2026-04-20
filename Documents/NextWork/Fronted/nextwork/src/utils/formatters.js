/**
 * formatters.js — Utility helpers for display formatting
 */

/**
 * Extracts a human-readable error message from an Axios error.
 * Tries response.data.mensaje (backend Spanish key), then response.data.message,
 * then response.data (if string), then falls back to the provided fallback.
 */
export function extractErrorMessage(err, fallback = 'Ha ocurrido un error') {
  const data = err?.response?.data
  const msg = data?.mensaje ?? data?.message ?? (typeof data === 'string' ? data : undefined) ?? fallback
  return typeof msg === 'string' ? msg : fallback
}

/**
 * Format an ISO date string (YYYY-MM-DD) to a readable Spanish date.
 * e.g. "2026-03-10" → "martes, 10 de marzo de 2026"
 */
export function formatFecha(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a time string (HH:mm:ss or HH:mm) to HH:mm.
 * e.g. "09:30:00" → "09:30"
 */
export function formatHora(timeStr) {
  if (!timeStr) return '—'
  return timeStr.substring(0, 5)
}

/**
 * Format modalidad enum value to a readable label.
 * e.g. "VIRTUAL" → "Virtual" | "PRESENCIAL" → "Presencial"
 */
export function formatModalidad(modalidad) {
  if (!modalidad) return '—'
  const map = {
    VIRTUAL: 'Virtual',
    PRESENCIAL: 'Presencial',
  }
  return map[modalidad.toUpperCase()] ?? modalidad
}

/**
 * Format appointment estado to a Bootstrap badge class.
 * Returns { label, badgeClass }
 */
export function estadoBadge(estado) {
  const map = {
    AGENDADA:   { label: 'Agendada',  badgeClass: 'bg-success' },
    CANCELADA:  { label: 'Cancelada', badgeClass: 'bg-danger' },
    REAGENDADA: { label: 'Pospuesta', badgeClass: 'bg-warning text-dark' },
    COMPLETADA: { label: 'Impartida', badgeClass: 'bg-success' },
  }
  return map[estado?.toUpperCase()] ?? { label: estado ?? '—', badgeClass: 'bg-light text-dark' }
}

/**
 * Return initials from a full name (up to 2 letters).
 * e.g. "Juan Pérez" → "JP"
 */
export function getInitials(nombres, apellidos) {
  const first = nombres?.charAt(0) ?? ''
  const last = apellidos?.charAt(0) ?? ''
  return (first + last).toUpperCase()
}
