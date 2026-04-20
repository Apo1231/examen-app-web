import api from './axiosConfig'

/**
 * POST /appointments
 * Book an appointment.
 * @param {{ idSlot: number, modalidad: string, descripcionClase?: string, linkMeet?: string }} data
 */
export const createAppointment = (data) => api.post('/appointments', data)

/**
 * PUT /appointments/:id/cancel
 * Cancel an appointment (BR-02: must be > 24h before).
 */
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`)

/**
 * PUT /appointments/:id/reschedule
 * Reschedule an appointment.
 * @param {number} id
 * @param {{ idSlotNuevo: number }} data
 */
export const rescheduleAppointment = (id, data) =>
  api.put(`/appointments/${id}/reschedule`, data)

/**
 * GET /appointments/student
 * Get the authenticated student's appointments.
 * @returns {Promise<Array<AppointmentResponse>>}
 */
export const getStudentAppointments = () => api.get('/appointments/student')

/**
 * GET /appointments/teacher
 * Get the authenticated teacher's appointments.
 * @returns {Promise<Array<AppointmentResponse>>}
 */
export const getTeacherAppointments = () => api.get('/appointments/teacher')

/**
 * POST /appointments/:id/ratings
 * Create rating for completed appointment.
 * @param {number} id
 * @param {{ estrellas: number, asistio: boolean, comentario?: string }} data
 */
export const createRating = (id, data) => api.post(`/appointments/${id}/ratings`, data)

/**
 * GET /appointments/:id/ratings/me
 * Returns current user's rating for appointment, or null if not rated yet.
 * @param {number} id
 */
export const getMyRatingByAppointment = async (id) => {
  const res = await api.get(`/appointments/${id}/ratings/me`)
  if (res.status === 204) return null
  return res.data
}
