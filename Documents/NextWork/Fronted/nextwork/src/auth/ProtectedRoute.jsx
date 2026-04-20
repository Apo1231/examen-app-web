import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * ProtectedRoute
 * - If not authenticated → redirect to /login
 * - If mustChangePassword → redirect to /change-password (unless already there)
 * - If roles provided → user must have one of the allowed roles
 *
 * @param {{ roles?: string[], children: React.ReactNode }} props
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user?.rol)) {
    // Authenticated but wrong role â€” send to their home
    return <Navigate to="/" replace />
  }

  return children
}
