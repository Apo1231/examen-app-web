import api from './axiosConfig'

/**
 * POST /auth/login
 * @param {{ correo: string, contrasena: string }} credentials
 * @returns {Promise<{ id, nombres, apellidos, correo, rol, mustChangePassword, token }>}
 */
export const login = (credentials) => api.post('/auth/login', credentials)

/**
 * POST /auth/register/alumno
 * @param {{ nombres, apellidos, correo, contrasena, telefono, telefonoEmergencia, parentesco }} data
 */
export const registerAlumno = (data) => api.post('/auth/register/alumno', data)

/**
 * PUT /auth/change-password
 * @param {{ contrasenaActual: string, contrasenaNueva: string }} data
 */
export const changePassword = (data) => api.put('/auth/change-password', data)

/**
 * POST /auth/forgot-password
 * @param {string} correo
 */
export const forgotPassword = (correo) => api.post('/auth/forgot-password', { correo })

/**
 * POST /auth/reset-password
 * @param {string} token
 * @param {string} nuevaPassword
 */
export const resetPassword = (token, nuevaPassword) =>
  api.post('/auth/reset-password', { token, nuevaPassword })

