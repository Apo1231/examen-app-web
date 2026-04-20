import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { changePassword } from '../api/auth.api'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { extractErrorMessage } from '../utils/formatters'

export default function ForcePasswordChangePage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ passwordActual: '', passwordNuevo: '', confirmar: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.passwordNuevo !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.passwordNuevo.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
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
      const updatedUser = { ...user, mustChangePassword: false }
      const token = localStorage.getItem('token')
      login(updatedUser, token)

      if (user?.rol === 'ROLE_MAESTRO') navigate('/maestro', { replace: true })
      else if (user?.rol === 'ROLE_ADMIN') navigate('/admin', { replace: true })
      else navigate('/alumno', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cambiar la contraseña'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-light d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Lock Icon Header */}
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: '4rem', height: '4rem', backgroundColor: '#dbeafe' }}
                  >
                    <Lock size={28} color="#2563eb" />
                  </div>
                  <h2 className="h4 mb-2">Cambiar Contraseña</h2>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Hola, <strong>{user?.nombres}</strong>. Debes establecer una nueva contraseña antes de continuar.
                  </p>
                </div>

                <div className="alert alert-warning py-2 mb-4" role="alert">
                  <small>
                    <strong>Acción requerida:</strong> Tu contraseña temporal debe ser cambiada antes de acceder al sistema.
                  </small>
                </div>

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label">Contraseña Actual</label>
                    <div className="input-group">
                      <input
                        name="passwordActual"
                        type={showCurrent ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Ingresa tu contraseña actual"
                        value={form.passwordActual}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="btn btn-outline-secondary"
                      >
                        {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nueva Contraseña</label>
                    <div className="input-group">
                      <input
                        name="passwordNuevo"
                        type={showNew ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Mínimo 6 caracteres"
                        value={form.passwordNuevo}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="btn btn-outline-secondary"
                      >
                        {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Confirmar Nueva Contraseña</label>
                    <div className="input-group">
                      <input
                        name="confirmar"
                        type={showConfirm ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Confirma tu nueva contraseña"
                        value={form.confirmar}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="btn btn-outline-secondary"
                      >
                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="alert alert-info py-2 mb-4">
                    <small>La contraseña debe tener al menos 6 caracteres.</small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Cambiar Contraseña
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
