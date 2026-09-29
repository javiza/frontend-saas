import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Applications() {
  const { session } = useAuth();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getApplications(session.token)
      .then(setApplications)
      .catch((err) => setError(err.message));
  }, [session.token]);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Aplicaciones</h1>
          <p className="page-subtitle">
            Estas son las apps que vendes: agencia_turismo y control_acceso.
          </p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {applications.length === 0 && !error && (
        <div className="empty-state">Todavía no hay aplicaciones en el catálogo.</div>
      )}

      <div className="grid">
        {applications.map((app) => (
          <div className="app-badge-card" key={app.id}>
            <span className="app-badge-code">{app.code}</span>
            <h3>{app.name}</h3>
            <p>{app.description}</p>
            <div style={{ marginTop: 12 }}>
              <span className={`status-pill ${app.active ? 'active' : 'inactive'}`}>
                <span className="dot" />
                {app.active ? 'Disponible' : 'Deshabilitada'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
