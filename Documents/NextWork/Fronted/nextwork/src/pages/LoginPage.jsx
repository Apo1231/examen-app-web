import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { login as apiLogin } from "../api/auth.api";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { extractErrorMessage } from "../utils/formatters";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ correo: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiLogin(form);
      const data = res.data;
      login(
        {
          id: data.id,
          nombres: data.nombres,
          apellidos: data.apellidos,
          correo: data.correo,
          rol: data.rol,
          mustChangePassword: data.mustChangePassword,
        },
        data.token,
      );

      if (data.mustChangePassword) {
        navigate("/change-password", { replace: true });
        return;
      }

      if (data.rol === "ROLE_ADMIN") navigate("/admin", { replace: true });
      else if (data.rol === "ROLE_MAESTRO")
        navigate("/maestro", { replace: true });
      else navigate("/alumno", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Logo and Title */}
                <div className="text-center mb-4">
                  <img
                    src="/NexWordLogo.svg"
                    alt="NextWork"
                    className="nextword-logo nextword-logo-auth d-block mb-3"
                  />
                  <h2 className="h3 mb-2">Iniciar Sesión</h2>
                  <p className="text-muted">
                    Ingresa tus credenciales para continuar
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="correo" className="form-label">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={form.correo}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      placeholder="tu@correo.com"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Contraseña
                    </label>
                    <div className="input-group input-group-lg">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Tu contraseña"
                        required
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
                    <div className="text-end mt-1">
                      <Link
                        to="/forgot-password"
                        className="text-primary text-decoration-none small"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                  </div>

                  <div className="d-grid gap-2 mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />
                          Iniciando sesión...
                        </>
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </button>
                  </div>

                  <div className="text-center mb-3">
                    <Link
                      to="/"
                      className="btn btn-link text-decoration-none d-inline-flex align-items-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      Volver
                    </Link>
                  </div>

                  <div
                    className="text-center text-muted"
                    style={{ fontSize: "0.9rem" }}
                  >
                    ¿No tienes cuenta?{" "}
                    <Link to="/register" className="text-primary fw-semibold">
                      Regístrate aquí
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
