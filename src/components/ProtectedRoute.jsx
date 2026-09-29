import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathForRole } from '../utils/roles';

// Antes: solo chequeaba "¿hay sesión?". Un usuario cliente (MANAGER/USER)
// podía navegar manualmente a /empresas o /aplicaciones (rutas de admin)
// y el guard lo dejaba pasar igual. Ahora cada ruta declara qué roles
// puede ver, y si el rol no matchea, se redirige a SU home, no al login.
export default function ProtectedRoute({ roles, children }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(session.role)) {
    return <Navigate to={homePathForRole(session.role)} replace />;
  }

  return children;
}
