import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import CompanyDetail from './pages/admin/CompanyDetail';
import Applications from './pages/admin/Applications';
import Plans from './pages/admin/Plans';
import MyApplications from './pages/portal/MyApplications';
import Catalog from './pages/portal/Catalog';
import PaymentCallback from './pages/portal/PaymentCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ADMIN_ROLES, CLIENT_ROLES, homePathForRole } from './utils/roles';

function Home() {
  const { session } = useAuth();
  return <Navigate to={homePathForRole(session?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Área admin de plataforma: gestiona empresas, catálogo y ventas */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/empresas"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Companies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/empresas/:id"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <CompanyDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/aplicaciones"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Applications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/planes"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Plans />
          </ProtectedRoute>
        }
      />

      {/* Portal cliente: usuarios de una empresa ven solo lo suyo */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute roles={CLIENT_ROLES}>
            <MyApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/catalogo"
        element={
          <ProtectedRoute roles={CLIENT_ROLES}>
            <Catalog />
          </ProtectedRoute>
        }
      />

      {/* Vuelta de Transbank tras registrar tarjeta (ver WebpayReturnController
          en el backend); no va protegida por rol porque la sesión puede haber
          quedado en un estado intermedio tras la navegación externa — la
          propia página valida que haya sesión antes de confirmar nada. */}
      <Route path="/payment-methods/callback" element={<PaymentCallback />} />

      {/* Raíz: si hay sesión, la manda directo a su home real según el rol */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
