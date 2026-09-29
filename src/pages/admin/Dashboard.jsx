import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

export default function Dashboard() {
  const { session } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [trialsEndingSoon, setTrialsEndingSoon] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCompanies(session.token),
      api.getApplications(session.token),
      api.getTrialsEndingSoon(session.token),
    ])
      .then(([c, a, trials]) => {
        setCompanies(c);
        setApplications(a);
        setTrialsEndingSoon(trials);
      })
      .catch((err) => setError(err.message));
  }, [session.token]);

  return (
    <AdminLayout>
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
        <div className="card stat-card">
          <div className="stat-value">{trialsEndingSoon.length}</div>
          <div className="stat-label">Pruebas gratis por vencer (48hs)</div>
        </div>
      </div>

      {trialsEndingSoon.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.05rem' }}>Pruebas gratis por vencer</h2>
          <div className="card table-wrap" style={{ marginBottom: 28 }}>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plan</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody>
                {trialsEndingSoon.map((s) => (
                  <tr key={s.id}>
                    <td>{s.companyName}</td>
                    <td>{s.planName}</td>
                    <td>{new Date(s.trialEndsAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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
    </AdminLayout>
  );
}
