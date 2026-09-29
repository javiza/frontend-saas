import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function CompanyDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([
      api.getCompanyApplications(session.token, id),
      api.getApplications(session.token),
    ])
      .then(([subs, apps]) => {
        setSubscriptions(subs);
        setCatalog(apps);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [session.token, id]);

  const availableToAssign = catalog.filter(
    (app) => !subscriptions.some((s) => s.applicationId === app.id)
  );

  async function handleAssign(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.assignApplication(session.token, id, selectedApp);
      setShowModal(false);
      setSelectedApp('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(sub) {
    try {
      await api.setApplicationStatus(session.token, id, sub.applicationId, !sub.active);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>{subscriptions[0]?.companyName || 'Empresa'}</h1>
          <p className="page-subtitle">Aplicaciones contratadas por esta empresa.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          disabled={availableToAssign.length === 0}
        >
          + Vender aplicación
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {subscriptions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            Esta empresa todavía no tiene aplicaciones contratadas.
          </div>
        </div>
      ) : (
        <div className="grid">
          {subscriptions.map((sub) => (
            <div className="app-badge-card" key={sub.id}>
              <span className="app-badge-code">{sub.applicationCode}</span>
              <h3>{sub.applicationName}</h3>
              <p>
                {sub.expiresAt
                  ? `Vence: ${new Date(sub.expiresAt).toLocaleDateString()}`
                  : 'Sin fecha de vencimiento'}
              </p>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`status-pill ${sub.active ? 'active' : 'inactive'}`}>
                  <span className="dot" />
                  {sub.active ? 'Activa' : 'Desactivada'}
                </span>
                <button className="btn-secondary" onClick={() => toggleStatus(sub)}>
                  {sub.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Vender aplicación</h2>
            <form onSubmit={handleAssign}>
              <div className="field">
                <label>Aplicación</label>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  required
                >
                  <option value="" disabled>Elegí una aplicación</option>
                  {availableToAssign.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
