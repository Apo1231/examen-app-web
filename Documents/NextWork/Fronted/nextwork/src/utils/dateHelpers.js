/**
 * dateHelpers.js — Shared date utilities for dashboard components
 */

/** Day name abbreviations (Monday-based week) */
export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Spanish month names (title case) */
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/**
 * Returns the Monday of the week that contains the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Returns YYYY-MM-DD from a Date object using local time (no timezone shift).
 * @param {Date} date
 * @returns {string}
 */
export function toLocalISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Opens a base64 QR code image in a new browser tab.
 * @param {string} base64 - The raw base64 string (without data URI prefix)
 */
export function openQrInNewTab(base64) {
  const w = window.open()
  if (w) {
    w.document.write(`<img src="data:image/png;base64,${base64}" style="max-width:300px"/>`)
  }
}
