import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerAlumno } from "../api/auth.api";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { extractErrorMessage } from "../utils/formatters";

const INITIAL = {
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
  confirmar: "",
  telefono: "",
  telefonoEmergencia: "",
  parentesco: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { confirmar, ...payload } = form;
      await registerAlumno(payload);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo completar el registro"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Logo and Title */}
                <div className="text-center mb-4">
                  <img
                    src="/NexWordLogo.svg"
                    alt="NextWork"
                    className="nextword-logo nextword-logo-auth d-block mb-3"
                  />
                  <h2 className="h3 mb-2">Registro de Alumno</h2>
                  <p className="text-muted">
                    Completa el formulario para crear tu cuenta
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Personal Information */}
                  <div className="mb-4">
                    <h5 className="mb-3">Información Personal</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="nombres" className="form-label">
                          Nombre(s)
                        </label>
                        <input
                          type="text"
                          id="nombres"
                          name="nombres"
                          value={form.nombres}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Juan"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="apellidos" className="form-label">
                          Apellidos
                        </label>
                        <input
                          type="text"
                          id="apellidos"
                          name="apellidos"
                          value={form.apellidos}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Pérez García"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="correo" className="form-label">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          id="correo"
                          name="correo"
                          value={form.correo}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="juan.perez@universidad.edu"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="telefono" className="form-label">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          id="telefono"
                          name="telefono"
                          value={form.telefono}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="(123) 456-7890"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="mb-4">
                    <h5 className="mb-3">Contacto de Emergencia</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="telefonoEmergencia"
                          className="form-label"
                        >
                          Teléfono de Emergencia
                        </label>
                        <input
                          type="tel"
                          id="telefonoEmergencia"
                          name="telefonoEmergencia"
                          value={form.telefonoEmergencia}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="(123) 456-7899"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="parentesco" className="form-label">
                          Relación
                        </label>
                        <select
                          id="parentesco"
                          name="parentesco"
                          value={form.parentesco}
                          onChange={handleChange}
                          className="form-select"
                          required
                        >
                          <option value="">Selecciona una relación</option>
                          <option value="Padre">Padre</option>
                          <option value="Madre">Madre</option>
                          <option value="Hermano/a">Hermano/a</option>
                          <option value="Tío/a">Tío/a</option>
                          <option value="Abuelo/a">Abuelo/a</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <h5 className="mb-3">Contraseña</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="password" className="form-label">
                          Contraseña
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="btn btn-outline-secondary"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="confirmar" className="form-label">
                          Confirmar Contraseña
                        </label>
                        <div className="input-group">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmar"
                            name="confirmar"
                            value={form.confirmar}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Repite tu contraseña"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="btn btn-outline-secondary"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="d-flex gap-3">
                    <Link
                      to="/"
                      className="btn btn-outline-secondary d-flex align-items-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      Volver
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary flex-grow-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />
                          Registrando...
                        </>
                      ) : (
                        "Crear Cuenta"
                      )}
                    </button>
                  </div>

                  <div
                    className="text-center mt-3 text-muted"
                    style={{ fontSize: "0.9rem" }}
                  >
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-primary fw-semibold">
                      Inicia sesión
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
