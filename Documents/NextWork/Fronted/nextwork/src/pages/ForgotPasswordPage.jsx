import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { forgotPassword } from '../api/auth.api'
import { extractErrorMessage } from '../utils/formatters'

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(correo)
      setSuccess(true)
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al enviar el correo. Intenta más tarde.'))
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
                  <h2 className="h4 mb-2">Recuperar Contraseña</h2>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>

                {success ? (
                  <div>
                    <div className="alert alert-success" role="alert">
                      Revisa tu correo. Si el correo está registrado, recibirás un enlace en breve.
                    </div>
                    <div className="text-center mt-3">
                      <Link to="/login" className="text-primary text-decoration-none small">
                        ← Volver al inicio de sesión
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="alert alert-danger py-2" role="alert">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-4">
                        <label htmlFor="correo" className="form-label">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          id="correo"
                          value={correo}
                          onChange={(e) => { setCorreo(e.target.value); setError('') }}
                          className="form-control form-control-lg"
                          placeholder="tu@correo.com"
                          required
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100 btn-lg mb-3"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar enlace de recuperación'
                        )}
                      </button>

                      <div className="text-center">
                        <Link to="/login" className="text-primary text-decoration-none small">
                          ← Volver al inicio de sesión
                        </Link>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
