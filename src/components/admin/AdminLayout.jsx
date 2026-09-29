import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin', label: 'Resumen', end: true },
  { to: '/admin/empresas', label: 'Empresas' },
  { to: '/admin/planes', label: 'Planes' },
  { to: '/admin/aplicaciones', label: 'Aplicaciones' },
];

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-badge">BP</span>
          Business Platform · Admin
        </div>

        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>{session?.name}</div>
          <div>{session?.role} · {session?.email}</div>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar">
          <button className="hamburger" onClick={() => setOpen((v) => !v)}>☰</button>
          <div className="brand" style={{ fontSize: '0.95rem' }}>
            <span className="brand-badge">BP</span>
            Business Platform · Admin
          </div>
        </div>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
