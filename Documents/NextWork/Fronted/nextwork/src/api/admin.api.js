import api from './axiosConfig'

/**
 * POST /admin/teachers
 * Create a new teacher (ADMIN only).
 * @param {{ nombres, apellidos, correo, contrasena, telefono, telefonoEmergencia, parentesco }} data
 */
export const createTeacher = (data) => api.post('/admin/teachers', data)

/**
 * PUT /admin/teachers/:id
 * Update a teacher (ADMIN only).
 */
export const updateTeacher = (id, data) => api.put(`/admin/teachers/${id}`, data)

/**
 * DELETE /admin/teachers/:id
 * Deactivate a teacher (ADMIN only).
 */
export const deleteTeacher = (id) => api.delete(`/admin/teachers/${id}`)

/**
 * PUT /admin/reset-password/:userId
 * Reset a user's password (ADMIN only).
 * @returns {Promise<{ passwordTemporal: string }>}
 */
export const resetPassword = (userId) => api.put(`/admin/reset-password/${userId}`)

/**
 * GET /admin/users?name=
 * Search users by name (ADMIN only).
 * @param {string} name
 */
export const searchUsers = (name) => api.get('/admin/users', { params: { name } })

/**
 * PUT /admin/users/:id
 * Update a user's basic info (ADMIN only).
 * @param {number} id
 * @param {{ nombres, apellidos, correo, telefono, telefonoEmergencia, parentesco }} data
 */
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data)

/**
 * GET /admin/reports/appointments/pdf
 * Download appointments report as PDF (ADMIN only).
 * @param {number} [userId] - Optional user ID to filter the report
 * @param {string} [modality] - Optional modality filter: 'VIRTUAL' | 'PRESENCIAL'
 * @returns {Promise<Blob>}
 */
export const getReportPdf = (userId, modality) => {
    const params = {}
    if (userId) params.studentId = userId
    if (modality) params.modality = modality
    return api.get('/admin/reports/appointments/pdf', {
        responseType: 'blob',
        params: Object.keys(params).length ? params : undefined,
    })
}


/**
 * GET /admin/reports/appointments/excel
 * Download appointments report as Excel (ADMIN only).
 * @param {number} [userId] - Optional user ID to filter the report
 * @param {string} [modality] - Optional modality filter: 'VIRTUAL' | 'PRESENCIAL'
 * @returns {Promise<Blob>}
 */
export const getReportExcel = (userId, modality) => {
    const params = {}
    if (userId) params.studentId = userId
    if (modality) params.modality = modality
    return api.get('/admin/reports/appointments/excel', {
        responseType: 'blob',
        params: Object.keys(params).length ? params : undefined,
    })
}
