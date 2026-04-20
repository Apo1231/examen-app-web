import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white border-bottom shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center gap-3">
              <img
                src="/NexWordLogo.svg"
                alt="NextWork"
                className="nextword-logo nextword-logo-header nextword-logo-landing"
              />
            </div>
            <div className="d-flex gap-2">
              <button
                onClick={() => navigate("/login")}
                className="btn btn-outline-primary"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate("/register")}
                className="btn btn-primary"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h1 className="display-4 mb-4">
                Aprende inglés con clases personalizadas
              </h1>
              <p className="lead text-muted mb-4">
                Conecta con profesores expertos para clases uno a uno, virtuales
                o presenciales. Agenda fácilmente y mejora tu nivel de inglés a
                tu ritmo.
              </p>
              <div className="d-flex gap-3">
                <button
                  onClick={() => navigate("/register")}
                  className="btn btn-primary btn-lg"
                >
                  Comienza Ahora
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="btn btn-outline-secondary btn-lg"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary"
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <Check size={24} color="white" />
                    </div>
                    <div>
                      <h5 className="mb-0">Clases Personalizadas</h5>
                      <p className="text-muted small mb-0">
                        Elige tu profesor y horario
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary"
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <Check size={24} color="white" />
                    </div>
                    <div>
                      <h5 className="mb-0">Virtual o Presencial</h5>
                      <p className="text-muted small mb-0">
                        Tú decides cómo aprender
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary"
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <Check size={24} color="white" />
                    </div>
                    <div>
                      <h5 className="mb-0">Profesores Certificados</h5>
                      <p className="text-muted small mb-0">
                        Expertos en enseñanza
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <h2 className="text-center mb-5">¿Por qué Nextword?</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle mb-3"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <span className="h3 mb-0 text-primary">📅</span>
                  </div>
                  <h5 className="card-title">Agenda Flexible</h5>
                  <p className="card-text text-muted">
                    Reserva clases cuando mejor te convenga, de 7:00 AM a 8:00
                    PM
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle mb-3"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <span className="h3 mb-0 text-primary">👨‍🏫</span>
                  </div>
                  <h5 className="card-title">Profesores Expertos</h5>
                  <p className="card-text text-muted">
                    Aprende con profesionales certificados y con amplia
                    experiencia
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle mb-3"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <span className="h3 mb-0 text-primary">🎯</span>
                  </div>
                  <h5 className="card-title">Aprendizaje Efectivo</h5>
                  <p className="card-text text-muted">
                    Clases uno a uno diseñadas para maximizar tu progreso
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <div className="container">
          <div className="card bg-primary text-white border-0 shadow-lg">
            <div className="card-body text-center p-5">
              <h2 className="mb-3">¿Listo para comenzar?</h2>
              <p className="lead mb-4 text-white-50">
                Únete a cientos de estudiantes que ya están mejorando su inglés
              </p>
              <button
                onClick={() => navigate("/register")}
                className="btn btn-light btn-lg"
              >
                Registrarse Gratis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="text-center">
            <p className="mb-0">
              &copy; 2026 NextWord. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
