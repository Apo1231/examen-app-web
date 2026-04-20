import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ProtectedRoute from '../auth/ProtectedRoute'

import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForcePasswordChangePage from '../pages/ForcePasswordChangePage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

import AlumnoDashboard from '../pages/alumno/AlumnoDashboard'
import ConfirmacionCita from '../pages/alumno/ConfirmacionCita'

import MaestroDashboard from '../pages/maestro/MaestroDashboard'

import AdminDashboard from '../pages/admin/AdminDashboard'

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <LandingPage />
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />
  if (user?.rol === 'ROLE_ADMIN') return <Navigate to="/admin" replace />
  if (user?.rol === 'ROLE_MAESTRO') return <Navigate to="/maestro" replace />
  return <Navigate to="/alumno" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root â€” shows LandingPage for unauthenticated, redirects for authenticated */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Force password change â€” authenticated but no role restriction */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ForcePasswordChangePage />
            </ProtectedRoute>
          }
        />

        {/* Alumno */}
        <Route
          path="/alumno"
          element={
            <ProtectedRoute roles={['ROLE_ALUMNO']}>
              <AlumnoDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumno/confirmacion"
          element={
            <ProtectedRoute roles={['ROLE_ALUMNO']}>
              <ConfirmacionCita />
            </ProtectedRoute>
          }
        />

        {/* Maestro */}
        <Route
          path="/maestro"
          element={
            <ProtectedRoute roles={['ROLE_MAESTRO']}>
              <MaestroDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ROLE_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
