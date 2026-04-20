import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  createTeacher,
  updateTeacher,
  updateUser,
  deleteTeacher,
  resetPassword,
  searchUsers,
  getReportPdf,
  getReportExcel,
} from "../../api/admin.api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { getInitials, extractErrorMessage } from "../../utils/formatters";
import {
  LogOut,
  User,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

const ITEMS_PER_PAGE = 5;

const TEACHER_INITIAL = {
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
  telefono: "",
  telefonoEmergencia: "",
  parentesco: "",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // â”€â”€ Header UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showUserMenu, setShowUserMenu] = useState(false);
  // â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState("students");

  // â”€â”€ Stats (computed from all users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [allUsers, setAllUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // â”€â”€ Alumnos tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [alumnoSearch, setAlumnoSearch] = useState("");
  const [alumnoPage, setAlumnoPage] = useState(1);
  const [resetResult, setResetResult] = useState({}); // { [id]: tempPassword }
  const [alumnoError, setAlumnoError] = useState("");

  // â”€â”€ Maestros tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [maestroSearch, setMaestroSearch] = useState("");
  const [maestroPage, setMaestroPage] = useState(1);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState(TEACHER_INITIAL);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");
  const [teacherSuccess, setTeacherSuccess] = useState("");
  const [maestroResetResult, setMaestroResetResult] = useState({});

  // â”€â”€ Alumno edit modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showAlumnoForm, setShowAlumnoForm] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState(null);
  const [alumnoForm, setAlumnoForm] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
  });
  const [savingAlumno, setSavingAlumno] = useState(false);
  const [alumnoFormError, setAlumnoFormError] = useState("");

  // â”€â”€ Historial tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [histSearch, setHistSearch] = useState("");
  const [histResults, setHistResults] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histError, setHistError] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [selectedModality, setSelectedModality] = useState("");

  // â”€â”€ Load all users on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadAllUsers = useCallback((silent = false) => {
    if (!silent) setLoadingStats(true);
    searchUsers("")
      .then((res) => setAllUsers(res.data))
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // â”€â”€ Derived lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const alumnos = allUsers.filter((u) => u.rol === "ROLE_ALUMNO");
  const maestros = allUsers.filter((u) => u.rol === "ROLE_MAESTRO");
  const activeCount = allUsers.filter((u) => u.activo).length;

  const filteredAlumnos = alumnos.filter((u) =>
    `${u.nombres} ${u.apellidos} ${u.correo}`
      .toLowerCase()
      .includes(alumnoSearch.toLowerCase()),
  );
  const filteredMaestros = maestros.filter((u) =>
    `${u.nombres} ${u.apellidos} ${u.correo}`
      .toLowerCase()
      .includes(maestroSearch.toLowerCase()),
  );

  const totalAlumnoPages = Math.max(
    1,
    Math.ceil(filteredAlumnos.length / ITEMS_PER_PAGE),
  );
  const totalMaestroPages = Math.max(
    1,
    Math.ceil(filteredMaestros.length / ITEMS_PER_PAGE),
  );
  const pagedAlumnos = filteredAlumnos.slice(
    (alumnoPage - 1) * ITEMS_PER_PAGE,
    alumnoPage * ITEMS_PER_PAGE,
  );
  const pagedMaestros = filteredMaestros.slice(
    (maestroPage - 1) * ITEMS_PER_PAGE,
    maestroPage * ITEMS_PER_PAGE,
  );

  // â”€â”€ Confirmation modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showConfirm = (title, message, onConfirm) =>
    setConfirmModal({ show: true, title, message, onConfirm });

  const closeConfirm = () =>
    setConfirmModal({ show: false, title: "", message: "", onConfirm: null });

  // â”€â”€ Reset password (shared) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleResetPassword = (idUsuario, isTeacher = false) => {
    showConfirm(
      "Resetear contraseña",
      "¿Estás seguro de que deseas resetear la contraseña de este usuario? Se generará una contraseña temporal.",
      async () => {
        try {
          const res = await resetPassword(idUsuario);
          const tmp = res.data?.passwordTemporal ?? res.data;
          if (isTeacher) {
            setMaestroResetResult((prev) => ({ ...prev, [idUsuario]: tmp }));
          } else {
            setResetResult((prev) => ({ ...prev, [idUsuario]: tmp }));
          }
        } catch (err) {
          const msg = extractErrorMessage(
            err,
            "No se pudo resetear la contraseña",
          );
          if (isTeacher) setTeacherError(msg);
          else setAlumnoError(msg);
        }
      },
    );
  };

  // â”€â”€ Alumno edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openEditAlumno = (u) => {
    setEditingAlumno(u);
    setAlumnoForm({
      nombres: u.nombres,
      apellidos: u.apellidos,
      correo: u.correo,
      telefono: u.telefono ?? "",
    });
    setAlumnoFormError("");
    setShowAlumnoForm(true);
  };

  const handleAlumnoFormChange = (e) => {
    setAlumnoForm({ ...alumnoForm, [e.target.name]: e.target.value });
    setAlumnoFormError("");
  };

  const handleAlumnoSubmit = async (e) => {
    e.preventDefault();
    setSavingAlumno(true);
    setAlumnoFormError("");
    try {
      await updateUser(editingAlumno.idUsuario, alumnoForm);
      setShowAlumnoForm(false);
      loadAllUsers(true);
    } catch (err) {
      setAlumnoFormError(
        extractErrorMessage(err, "No se pudo guardar el alumno"),
      );
    } finally {
      setSavingAlumno(false);
    }
  };

  // â”€â”€ Teacher CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openCreate = () => {
    setEditingTeacher(null);
    setTeacherForm(TEACHER_INITIAL);
    setTeacherError("");
    setTeacherSuccess("");
    setShowTeacherForm(true);
  };

  const openEdit = (t) => {
    setEditingTeacher(t);
    setTeacherForm({
      nombres: t.nombres,
      apellidos: t.apellidos,
      correo: t.correo,
      password: "",
      telefono: t.telefono ?? "",
      telefonoEmergencia: t.telefonoEmergencia ?? "",
      parentesco: t.parentesco ?? "",
    });
    setTeacherError("");
    setTeacherSuccess("");
    setShowTeacherForm(true);
  };

  const handleTeacherChange = (e) => {
    setTeacherForm({ ...teacherForm, [e.target.name]: e.target.value });
    setTeacherError("");
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setSavingTeacher(true);
    setTeacherError("");
    setTeacherSuccess("");
    try {
      if (editingTeacher) {
        const {  ...payload } = teacherForm;
        await updateTeacher(editingTeacher.idUsuario, payload);
        setTeacherSuccess("Maestro actualizado correctamente.");
      } else {
        await createTeacher(teacherForm);
        setTeacherSuccess(
          "Maestro creado. Puede iniciar sesión con su correo y contraseña temporal.",
        );
      }
      setShowTeacherForm(false);
      loadAllUsers(true);
    } catch (err) {
      setTeacherError(
        extractErrorMessage(err, "No se pudo guardar el maestro"),
      );
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleDeleteTeacher = (id) => {
    showConfirm(
      "Desactivar maestro",
      "¿Estás seguro de que deseas desactivar este maestro? Ya no podrá iniciar sesión en el sistema.",
      async () => {
        try {
          await deleteTeacher(id);
          loadAllUsers();
        } catch (err) {
          setTeacherError(
            extractErrorMessage(err, "No se pudo desactivar el maestro"),
          );
        }
      },
    );
  };

  // â”€â”€ Historial search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleHistSearch = async (e) => {
    e.preventDefault();
    setLoadingHist(true);
    setHistError("");
    setSelectedPerson(null);
    try {
      const res = await searchUsers(histSearch);
      setHistResults(res.data);
    } catch (err) {
      setHistError(extractErrorMessage(err, "Error al buscar usuarios"));
    } finally {
      setLoadingHist(false);
    }
  };

  // â”€â”€ PDF report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    setPdfError("");
    try {
      const res = await getReportPdf(selectedPerson?.idUsuario, selectedModality || undefined);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedPerson
        ? `reporte-${selectedPerson.nombres}-${selectedPerson.apellidos}.pdf`
        : "reporte-citas.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(
        extractErrorMessage(err, "No se pudo generar el reporte PDF"),
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setGeneratingExcel(true);
    setPdfError("");
    try {
      const res = await getReportExcel(selectedPerson?.idUsuario, selectedModality || undefined);
      const url = URL.createObjectURL(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedPerson
        ? `reporte-${selectedPerson.nombres}-${selectedPerson.apellidos}.xlsx`
        : "reporte-citas.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(
        extractErrorMessage(err, "No se pudo generar el reporte Excel"),
      );
    } finally {
      setGeneratingExcel(false);
    }
  };

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const rolLabel = (rol) => {
    if (rol === "ROLE_MAESTRO") return "Maestro";
    if (rol === "ROLE_ALUMNO") return "Alumno";
    return "Admin";
  };

  return (
    <div className="min-h-screen bg-light">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center py-3">
            <img
              src="/NexWordLogo.svg"
              alt="NextWork"
              className="nextword-logo nextword-logo-header nextword-logo-landing"
            />

            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <button
                  className="btn btn-light"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User size={20} />
                </button>
                {showUserMenu && (
                  <div
                    className="dropdown-menu show shadow"
                    style={{ right: 0, left: "auto", minWidth: 200 }}
                  >
                    <div className="dropdown-header">
                      <small className="text-muted">
                        {user?.nombres} {user?.apellidos}
                      </small>
                    </div>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowPasswordModal(true);
                      }}
                    >
                      Cambiar Contraseña
                    </button>
                  </div>
                )}
              </div>

              <button
                className="btn btn-light d-flex align-items-center gap-2"
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="container-fluid py-4">
        <div className="mb-4">
          <h2 className="h3 mb-1">Panel de Administración</h2>
          <p className="text-muted mb-0">
            Gestiona usuarios, maestros y contraseñas del sistema
          </p>
        </div>

        {/* Stats cards */}
        {loadingStats ? (
          <LoadingSpinner message="Cargando estadísticas..." />
        ) : (
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">Total Alumnos</p>
                      <p className="h2 mb-0">{alumnos.length}</p>
                    </div>
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded"
                      style={{
                        width: "3rem",
                        height: "3rem",
                        backgroundColor: "#dbeafe",
                      }}
                    >
                      <User size={24} color="#2563eb" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">Total Maestros</p>
                      <p className="h2 mb-0">{maestros.length}</p>
                    </div>
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded"
                      style={{
                        width: "3rem",
                        height: "3rem",
                        backgroundColor: "#e9d5ff",
                      }}
                    >
                      <User size={24} color="#9333ea" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">Usuarios Activos</p>
                      <p className="h2 mb-0">{activeCount}</p>
                    </div>
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded"
                      style={{
                        width: "3rem",
                        height: "3rem",
                        backgroundColor: "#dcfce7",
                      }}
                    >
                      <User size={24} color="#16a34a" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs card */}
        <div className="card shadow-sm">
          <div className="card-header bg-white border-bottom">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "students" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("students");
                    setAlumnoPage(1);
                  }}
                >
                  Gestión de Alumnos
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "teachers" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("teachers");
                    setMaestroPage(1);
                  }}
                >
                  Gestión de Maestros
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("history");
                    setSelectedPerson(null);
                    setHistResults([]);
                  }}
                >
                  Historial
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">
            {/* â•â• Gestión de Alumnos â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === "students" && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-1">Gestión de Alumnos</h5>
                  <p className="text-muted small mb-0">
                    Consulta y administra los alumnos registrados
                  </p>
                </div>

                {alumnoError && (
                  <div className="alert alert-danger py-2 mb-3">
                    {alumnoError}
                  </div>
                )}

                {/* Search */}
                <div className="mb-4" style={{ maxWidth: "28rem" }}>
                  <div className="position-relative">
                    <Search
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: "0.75rem" }}
                      size={18}
                    />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Buscar por nombre o correo..."
                      value={alumnoSearch}
                      onChange={(e) => {
                        setAlumnoSearch(e.target.value);
                        setAlumnoPage(1);
                      }}
                    />
                  </div>
                </div>

                {loadingStats ? (
                  <LoadingSpinner message="Cargando alumnos..." />
                ) : filteredAlumnos.length === 0 ? (
                  <div className="text-center py-5">
                    <User size={48} className="text-muted mb-3" />
                    <p className="text-muted">No se encontraron alumnos.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Usuario</th>
                            <th>Contacto</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Contraseña temp.</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedAlumnos.map((u) => (
                            <tr key={u.idUsuario}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                    style={{
                                      width: "2.5rem",
                                      height: "2.5rem",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {getInitials(u.nombres, u.apellidos)}
                                  </div>
                                  <div>
                                    <p className="mb-0 fw-semibold">
                                      {u.nombres} {u.apellidos}
                                    </p>
                                    <small className="text-muted">
                                      {u.correo}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>{u.telefono ?? "—"}</td>
                              <td>
                                <span
                                  className={`badge ${u.activo ? "bg-success" : "bg-danger"}`}
                                >
                                  {u.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td>
                                {u.fechaRegistro
                                  ? new Date(
                                      u.fechaRegistro,
                                    ).toLocaleDateString("es-MX")
                                  : "—"}
                              </td>
                              <td>
                                {resetResult[u.idUsuario] ? (
                                  <code className="text-success fw-bold">
                                    {resetResult[u.idUsuario]}
                                  </code>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex gap-1 flex-wrap">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openEditAlumno(u)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="btn btn-outline-warning btn-sm"
                                    onClick={() =>
                                      handleResetPassword(u.idUsuario, false)
                                    }
                                  >
                                    Restablecer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalAlumnoPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setAlumnoPage(alumnoPage - 1)}
                          disabled={alumnoPage === 1}
                        >
                          <ChevronLeft size={18} /> Anterior
                        </button>
                        <small className="text-muted">
                          Mostrando {(alumnoPage - 1) * ITEMS_PER_PAGE + 1}–
                          {Math.min(
                            alumnoPage * ITEMS_PER_PAGE,
                            filteredAlumnos.length,
                          )}{" "}
                          de {filteredAlumnos.length}
                        </small>
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setAlumnoPage(alumnoPage + 1)}
                          disabled={alumnoPage === totalAlumnoPages}
                        >
                          Siguiente <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* â•â• Gestión de Maestros â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === "teachers" && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-1">Gestión de Maestros</h5>
                  <p className="text-muted small mb-0">
                    Administra los maestros del sistema
                  </p>
                </div>

                {teacherSuccess && !showTeacherForm && (
                  <div className="alert alert-success py-2 mb-3">
                    {teacherSuccess}
                  </div>
                )}
                {teacherError && !showTeacherForm && (
                  <div className="alert alert-danger py-2 mb-3">
                    {teacherError}
                  </div>
                )}

                {/* Search + New button */}
                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
                  <div
                    className="position-relative flex-grow-1"
                    style={{ maxWidth: "28rem" }}
                  >
                    <Search
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: "0.75rem" }}
                      size={18}
                    />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Buscar por nombre o correo..."
                      value={maestroSearch}
                      onChange={(e) => {
                        setMaestroSearch(e.target.value);
                        setMaestroPage(1);
                      }}
                    />
                  </div>
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={openCreate}
                  >
                    <Plus size={16} />
                    Nuevo Maestro
                  </button>
                </div>

                {loadingStats ? (
                  <LoadingSpinner message="Cargando maestros..." />
                ) : filteredMaestros.length === 0 ? (
                  <div className="text-center py-5">
                    <User size={48} className="text-muted mb-3" />
                    <p className="text-muted">No se encontraron maestros.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Usuario</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Contraseña temp.</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedMaestros.map((t) => (
                            <tr key={t.idUsuario}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                    style={{
                                      width: "2.5rem",
                                      height: "2.5rem",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {getInitials(t.nombres, t.apellidos)}
                                  </div>
                                  <div>
                                    <p className="mb-0 fw-semibold">
                                      {t.nombres} {t.apellidos}
                                    </p>
                                    <small className="text-muted">
                                      {t.correo}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>{t.telefono ?? "—"}</td>
                              <td>
                                <span
                                  className={`badge ${t.activo ? "bg-success" : "bg-danger"}`}
                                >
                                  {t.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td>
                                {t.fechaRegistro
                                  ? new Date(
                                      t.fechaRegistro,
                                    ).toLocaleDateString("es-MX")
                                  : "—"}
                              </td>
                              <td>
                                {maestroResetResult[t.idUsuario] ? (
                                  <code className="text-success fw-bold">
                                    {maestroResetResult[t.idUsuario]}
                                  </code>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex gap-1 flex-wrap">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openEdit(t)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="btn btn-outline-warning btn-sm"
                                    onClick={() =>
                                      handleResetPassword(t.idUsuario, true)
                                    }
                                  >
                                    Restablecer
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      handleDeleteTeacher(t.idUsuario)
                                    }
                                  >
                                    Desactivar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalMaestroPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setMaestroPage(maestroPage - 1)}
                          disabled={maestroPage === 1}
                        >
                          <ChevronLeft size={18} /> Anterior
                        </button>
                        <small className="text-muted">
                          Mostrando {(maestroPage - 1) * ITEMS_PER_PAGE + 1}–
                          {Math.min(
                            maestroPage * ITEMS_PER_PAGE,
                            filteredMaestros.length,
                          )}{" "}
                          de {filteredMaestros.length}
                        </small>
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          onClick={() => setMaestroPage(maestroPage + 1)}
                          disabled={maestroPage === totalMaestroPages}
                        >
                          Siguiente <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* â•â• Historial â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === "history" && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-1">Historial de Usuarios y Clases</h5>
                  <p className="text-muted small mb-0">
                    Busca por nombre para ver la información del usuario y
                    descargar su reporte
                  </p>
                </div>

                {/* Search form */}
                <form
                  onSubmit={handleHistSearch}
                  className="d-flex gap-2 mb-4"
                  style={{ maxWidth: "32rem" }}
                >
                  <div className="position-relative flex-grow-1">
                    <Search
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: "0.75rem" }}
                      size={18}
                    />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Buscar por nombre de alumno o maestro..."
                      value={histSearch}
                      onChange={(e) => {
                        setHistSearch(e.target.value);
                        setSelectedPerson(null);
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loadingHist}
                  >
                    {loadingHist ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        aria-hidden="true"
                      />
                    ) : (
                      "Buscar"
                    )}
                  </button>
                </form>

                {histError && (
                  <div className="alert alert-danger py-2 mb-3">
                    {histError}
                  </div>
                )}

                {/* Empty state */}
                {!loadingHist &&
                  histResults.length === 0 &&
                  !selectedPerson && (
                    <div className="text-center py-5">
                      <Search size={48} className="text-muted mb-3" />
                      <p className="text-muted">
                        Utiliza el buscador para encontrar un alumno o maestro
                      </p>
                    </div>
                  )}

                {/* Search results list */}
                {!selectedPerson && histResults.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <small className="text-muted">
                        Resultados de búsqueda
                      </small>
                    </div>
                    <div className="list-group list-group-flush">
                      {histResults.map((u) => (
                        <button
                          key={u.idUsuario}
                          className="list-group-item list-group-item-action"
                          onClick={() => setSelectedPerson(u)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                              style={{
                                width: "2.5rem",
                                height: "2.5rem",
                                fontSize: "0.85rem",
                              }}
                            >
                              {getInitials(u.nombres, u.apellidos)}
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-semibold">
                                {u.nombres} {u.apellidos}
                              </p>
                              <small className="text-muted">
                                {rolLabel(u.rol)} • {u.correo}
                              </small>
                            </div>
                            <span
                              className={`badge ${u.activo ? "bg-success" : "bg-danger"}`}
                            >
                              {u.activo ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected person details */}
                {selectedPerson && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                      <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => setSelectedPerson(null)}
                      >
                        ← Volver a resultados
                      </button>
                      <div>
                        {pdfError && (
                          <span className="text-danger me-3 small">
                            {pdfError}
                          </span>
                        )}
                        <div className="d-flex gap-2 flex-wrap justify-content-end align-items-center">
                          <select
                              className="form-select form-select-sm"
                              style={{ width: "auto" }}
                              value={selectedModality}
                              onChange={(e) => setSelectedModality(e.target.value)}
                          >
                            <option value="">Todas las modalidades</option>
                            <option value="VIRTUAL">Virtual</option>
                            <option value="PRESENCIAL">Presencial</option>
                          </select>
                          <button
                              className="btn btn-primary d-inline-flex align-items-center gap-2"
                              onClick={handleDownloadPdf}
                            disabled={generatingPdf || generatingExcel}
                          >
                            {generatingPdf ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm"
                                  aria-hidden="true"
                                />{" "}
                                Generando PDF...
                              </>
                            ) : (
                              <>
                                <FileText size={16} /> Descargar PDF
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-success d-inline-flex align-items-center gap-2"
                            onClick={handleDownloadExcel}
                            disabled={generatingExcel || generatingPdf}
                          >
                            {generatingExcel ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm"
                                  aria-hidden="true"
                                />{" "}
                                Generando Excel...
                              </>
                            ) : (
                              <>
                                <FileText size={16} /> Descargar Excel
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-body">
                        <h6 className="mb-3">Información Personal</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <small className="text-muted d-block">
                              Nombre completo
                            </small>
                            <p className="mb-0">
                              {selectedPerson.nombres}{" "}
                              {selectedPerson.apellidos}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">Rol</small>
                            <p className="mb-0">
                              {rolLabel(selectedPerson.rol)}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">
                              Correo electrónico
                            </small>
                            <p className="mb-0">{selectedPerson.correo}</p>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">
                              Teléfono
                            </small>
                            <p className="mb-0">
                              {selectedPerson.telefono ?? "—"}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">Estado</small>
                            <span
                              className={`badge ${selectedPerson.activo ? "bg-success" : "bg-danger"}`}
                            >
                              {selectedPerson.activo ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* â”€â”€ Confirm Action Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {confirmModal.show && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{confirmModal.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeConfirm}
                />
              </div>
              <div className="modal-body">
                <p className="mb-0">{confirmModal.message}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeConfirm}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    confirmModal.onConfirm();
                    closeConfirm();
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Edit Alumno Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showAlumnoForm && editingAlumno && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Alumno</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAlumnoForm(false)}
                />
              </div>
              <form onSubmit={handleAlumnoSubmit} noValidate>
                <div className="modal-body">
                  {alumnoFormError && (
                    <div className="alert alert-danger py-2">
                      {alumnoFormError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Nombre completo</label>
                    <input
                      name="nombres"
                      type="text"
                      className="form-control"
                      placeholder="Nombres"
                      value={alumnoForm.nombres}
                      onChange={handleAlumnoFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Apellidos</label>
                    <input
                      name="apellidos"
                      type="text"
                      className="form-control"
                      placeholder="Apellidos"
                      value={alumnoForm.apellidos}
                      onChange={handleAlumnoFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo electrónico</label>
                    <input
                      name="correo"
                      type="email"
                      className="form-control"
                      value={alumnoForm.correo}
                      onChange={handleAlumnoFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      name="telefono"
                      type="tel"
                      className="form-control"
                      value={alumnoForm.telefono}
                      onChange={handleAlumnoFormChange}
                    />
                  </div>

                  {/* Emergency info â€” read-only display */}
                  {(editingAlumno.telefonoEmergencia ||
                    editingAlumno.parentesco) && (
                    <div
                      className="p-3 rounded"
                      style={{
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      <p className="fw-semibold mb-2 small">
                        Información de Emergencia
                      </p>
                      {editingAlumno.telefonoEmergencia && (
                        <div className="mb-1">
                          <small className="text-muted d-block">
                            Teléfono de Emergencia
                          </small>
                          <small>{editingAlumno.telefonoEmergencia}</small>
                        </div>
                      )}
                      {editingAlumno.parentesco && (
                        <div>
                          <small className="text-muted d-block">Relación</small>
                          <small>{editingAlumno.parentesco}</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAlumnoForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingAlumno}
                  >
                    {savingAlumno ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Teacher Form Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showTeacherForm && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTeacher ? "Editar Maestro" : "Nuevo Maestro"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTeacherForm(false)}
                />
              </div>
              <form onSubmit={handleTeacherSubmit} noValidate>
                <div className="modal-body">
                  {teacherError && (
                    <div className="alert alert-danger py-2">
                      {teacherError}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label">Nombres</label>
                      <input
                        name="nombres"
                        type="text"
                        className="form-control"
                        value={teacherForm.nombres}
                        onChange={handleTeacherChange}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Apellidos</label>
                      <input
                        name="apellidos"
                        type="text"
                        className="form-control"
                        value={teacherForm.apellidos}
                        onChange={handleTeacherChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Correo electrónico</label>
                      <input
                        name="correo"
                        type="email"
                        className="form-control"
                        value={teacherForm.correo}
                        onChange={handleTeacherChange}
                        required
                      />
                    </div>
                    {!editingTeacher && (
                      <div className="col-12">
                        <label className="form-label">
                          Contraseña temporal
                        </label>
                        <input
                          name="password"
                          type="text"
                          className="form-control"
                          placeholder="El maestro deberá cambiarla en su primer acceso"
                          value={teacherForm.password}
                          onChange={handleTeacherChange}
                          required
                        />
                      </div>
                    )}
                    <div className="col-sm-6">
                      <label className="form-label">Teléfono</label>
                      <input
                        name="telefono"
                        type="tel"
                        className="form-control"
                        value={teacherForm.telefono}
                        onChange={handleTeacherChange}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">
                        Teléfono de emergencia
                      </label>
                      <input
                        name="telefonoEmergencia"
                        type="tel"
                        className="form-control"
                        value={teacherForm.telefonoEmergencia}
                        onChange={handleTeacherChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Parentesco (contacto de emergencia)
                      </label>
                      <input
                        name="parentesco"
                        type="text"
                        className="form-control"
                        value={teacherForm.parentesco}
                        onChange={handleTeacherChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowTeacherForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingTeacher}
                  >
                    {savingTeacher ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Guardando...
                      </>
                    ) : editingTeacher ? (
                      "Guardar cambios"
                    ) : (
                      "Crear Maestro"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        autoClose
      />
    </div>
  );
}
