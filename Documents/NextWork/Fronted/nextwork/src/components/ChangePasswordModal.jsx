import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { changePassword } from '../api/auth.api'
import { extractErrorMessage } from '../utils/formatters'
import { Eye, EyeOff, Lock } from 'lucide-react'

const MIN_PASSWORD_LENGTH = 6

const INITIAL_FORM = { passwordActual: '', passwordNuevo: '', confirmar: '' }

/**
 * Reusable change-password modal for all dashboards.
 *
 * Props:
 *   show        {boolean}  - whether the modal is visible
 *   onClose     {function} - called when the modal should be dismissed
 *   onSuccess   {function} - optional callback after a successful password change
 *   autoClose   {boolean}  - if true, closes the modal 1.5s after success (default: false)
 */
export default function ChangePasswordModal({ show, onClose, onSuccess, autoClose = false }) {
  const { user } = useAuth()

  const [form, setForm] = useState(INITIAL_FORM)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setError('')
    setSuccess('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    onClose()
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.passwordActual || !form.passwordNuevo || !form.confirmar) {
      setError('Por favor, completa todos los campos')
      return
    }
    if (form.passwordNuevo !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.passwordNuevo.length < MIN_PASSWORD_LENGTH) {
      setError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
      return
    }
    setLoading(true)
    setError('')
    try {
      await changePassword({
        correo: user.correo,
        passwordActual: form.passwordActual,
        passwordNuevo: form.passwordNuevo,
      })
      setSuccess('Contraseña actualizada exitosamente.')
      setForm(INITIAL_FORM)
      if (onSuccess) onSuccess()
      if (autoClose) {
        setTimeout(() => handleClose(), 1500)
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cambiar la contraseña'))
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded"
                style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#dbeafe' }}
              >
                <Lock size={20} color="#2563eb" />
              </div>
              Cambiar Contraseña
            </h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              {success && <div className="alert alert-success py-2">{success}</div>}

              <div className="mb-3">
                <label className="form-label">Contraseña actual</label>
                <div className="input-group">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    name="passwordActual"
                    className="form-control"
                    value={form.passwordActual}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Nueva contraseña</label>
                <div className="input-group">
                  <input
                    type={showNew ? 'text' : 'password'}
                    name="passwordNuevo"
                    className="form-control"
                    value={form.passwordNuevo}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Confirmar nueva contraseña</label>
                <div className="input-group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmar"
                    className="form-control"
                    value={form.confirmar}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="alert alert-info py-2">
                <small>La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.</small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Guardando...</>
                ) : (
                  <><Lock size={16} /> Cambiar Contraseña</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
