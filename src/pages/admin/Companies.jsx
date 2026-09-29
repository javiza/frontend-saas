import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

export default function Companies() {
  const { session } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    api
      .getCompanies(session.token)
      .then(setCompanies)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [session.token]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createCompany(session.token, form);
      setShowModal(false);
      setForm({ name: '', email: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Empresas</h1>
          <p className="page-subtitle">Clientes de tu SaaS. Entra a una para venderle aplicaciones.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nueva empresa
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card table-wrap">
        {companies.length === 0 ? (
          <div className="empty-state">Todavía no registraste ninguna empresa.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>
                    <Link to={`/admin/empresas/${c.id}`} className="btn-secondary">
                      Ver aplicaciones
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva empresa</h2>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
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
                  {saving ? 'Creando…' : 'Crear empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
