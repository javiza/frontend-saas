import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

const EMPTY_FORM = { code: '', name: '', description: '' };

export default function Applications() {
  const { session } = useAuth();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function load() {
    api
      .getApplications(session.token)
      .then(setApplications)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [session.token]);

  function openModal() {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function handleCodeChange(value) {
    // El backend exige mayúsculas + guion bajo (ej: CONTROL_ACCESS), así
    // que normalizamos acá para que no rebote por un detalle de formato.
    setForm((f) => ({
      ...f,
      code: value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.createApplication(session.token, form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Aplicaciones</h1>
          <p className="page-subtitle">
            Estas son las apps que vendes: agencia_turismo y control_acceso.
          </p>
        </div>
        <button className="btn-primary" onClick={openModal}>
          + Nueva aplicación
        </button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva aplicación</h2>
            <form onSubmit={handleCreate}>
              {formError && <div className="alert error">{formError}</div>}
              <div className="field">
                <label>Código</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="CONTROL_ACCESS"
                  required
                  maxLength={50}
                />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Control de Acceso"
                  required
                  maxLength={120}
                />
              </div>
              <div className="field">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Gestión de ingresos, salidas, visitantes y autorizaciones."
                  required
                  maxLength={500}
                  rows={3}
                />
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
                  {saving ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
