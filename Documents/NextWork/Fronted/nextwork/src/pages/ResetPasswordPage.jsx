import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../api/auth.api";
import { extractErrorMessage } from "../utils/formatters";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [form, setForm] = useState({ nuevaPassword: "", confirmar: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.nuevaPassword !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("El enlace de recuperación no es válido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, form.nuevaPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        extractErrorMessage(err, "El enlace no es válido o ha expirado."),
      );
    } finally {
      setLoading(false);
    }
  };

  // No token in URL at all
  if (!token) {
    return (
      <div className="min-h-screen bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5 text-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{
                      width: "4rem",
                      height: "4rem",
                      backgroundColor: "#fee2e2",
                    }}
                  >
                    <Lock size={28} color="#dc2626" />
                  </div>
                  <h2 className="h4 mb-3">Enlace no válido</h2>
                  <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
                    Este enlace de recuperación no es válido. Solicita uno
                    nuevo.
                  </p>
                  <Link to="/forgot-password" className="btn btn-primary">
                    Solicitar nuevo enlace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                    style={{
                      width: "4rem",
                      height: "4rem",
                      backgroundColor: "#dbeafe",
                    }}
                  >
                    <Lock size={28} color="#2563eb" />
                  </div>
                  <h2 className="h4 mb-2">Restablecer Contraseña</h2>
                  <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                    Crea una nueva contraseña para tu cuenta
                  </p>
                </div>

                {success ? (
                  <div>
                    <div className="alert alert-success" role="alert">
                      Tu contraseña ha sido restablecida correctamente.
                    </div>
                    <div className="text-center mt-3">
                      <Link to="/login" className="btn btn-primary">
                        Ir al inicio de sesión
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
                      <div className="mb-3">
                        <label className="form-label">Nueva Contraseña</label>
                        <div className="input-group">
                          <input
                            name="nuevaPassword"
                            type={showNew ? "text" : "password"}
                            className="form-control"
                            placeholder="Mínimo 6 caracteres"
                            value={form.nuevaPassword}
                            onChange={handleChange}
                            required
                            autoFocus
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
                        <label className="form-label">
                          Confirmar Nueva Contraseña
                        </label>
                        <div className="input-group">
                          <input
                            name="confirmar"
                            type={showConfirm ? "text" : "password"}
                            className="form-control"
                            placeholder="Repite tu nueva contraseña"
                            value={form.confirmar}
                            onChange={handleChange}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="btn btn-outline-secondary"
                          >
                            {showConfirm ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            Restableciendo...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Restablecer contraseña
                          </>
                        )}
                      </button>

                      <div className="text-center mt-3">
                        <Link
                          to="/login"
                          className="text-primary text-decoration-none small"
                        >
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
  );
}
