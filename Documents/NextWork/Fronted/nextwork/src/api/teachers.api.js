import api from './axiosConfig'

/**
 * GET /teachers
 * Returns all active teachers.
 * @returns {Promise<Array<{ idUsuario, nombres, apellidos, correo, telefono, telefonoEmergencia, parentesco, rol, activo }>>}
 */
export const getTeachers = () => api.get('/teachers')
