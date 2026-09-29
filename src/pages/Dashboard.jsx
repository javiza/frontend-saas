import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { session } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCompanies(session.token),
      api.getApplications(session.token),
    ])
      .then(([c, a]) => {
        setCompanies(c);
        setApplications(a);
      })
      .catch((err) => setError(err.message));
  }, [session.token]);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Resumen</h1>
          <p className="page-subtitle">Vista general de tu SaaS de turismo y control de acceso.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="grid" style={{ marginBottom: 28 }}>
        <div className="card stat-card">
          <div className="stat-value">{companies.length}</div>
          <div className="stat-label">Empresas registradas</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{applications.length}</div>
          <div className="stat-label">Aplicaciones en el catálogo</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.05rem' }}>Catálogo de aplicaciones</h2>
      <div className="grid">
        {applications.map((app) => (
          <div className="app-badge-card" key={app.id}>
            <span className="app-badge-code">{app.code}</span>
            <h3>{app.name}</h3>
            <p>{app.description}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
