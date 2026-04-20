import api from './axiosConfig'

/**
 * POST /slots
 * Create a new availability slot (MAESTRO / ADMIN).
 * @param {{ fecha: string, horaInicio: string, horaFin: string, modalidad: string }} data
 */
export const createSlot = (data) => api.post('/slots', data)

/**
 * DELETE /slots/:id
 * Delete a slot (MAESTRO / ADMIN).
 */
export const deleteSlot = (id) => api.delete(`/slots/${id}`)

/**
 * GET /slots/my
 * Get the authenticated teacher's own slots.
 * @returns {Promise<Array<SlotDTO>>}
 */
export const getMySlots = () => api.get('/slots/my')

/**
 * GET /appointments/available?teacherId=&date=
 * Get available slots for a teacher on a date.
 * @param {number} teacherId
 * @param {string} date — YYYY-MM-DD
 * @returns {Promise<Array<SlotDTO>>}
 */
export const getAvailableSlots = (teacherId, date) =>
  api.get('/appointments/available', { params: { teacherId, date } })
