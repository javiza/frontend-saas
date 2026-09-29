import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

const BILLING_LABELS = {
  MENSUAL: '/ mes',
  ANUAL: '/ año',
  UNICO: 'pago único',
};

const emptyForm = {
  code: '',
  name: '',
  description: '',
  price: '',
  billingCycle: 'MENSUAL',
  trialDays: 15,
  applicationIds: [],
};

export default function Plans() {
  const { session } = useAuth();
  const [plans, setPlans] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([api.getPlans(session.token), api.getApplications(session.token)])
      .then(([p, apps]) => {
        setPlans(p);
        setCatalog(apps);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [session.token]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(plan) {
    setEditingId(plan.id);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      trialDays: plan.trialDays,
      applicationIds: plan.applications.map((a) => a.id),
    });
    setShowModal(true);
  }

  function toggleApp(appId) {
    setForm((f) => ({
      ...f,
      applicationIds: f.applicationIds.includes(appId)
        ? f.applicationIds.filter((id) => id !== appId)
        : [...f.applicationIds, appId],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        price: Number(form.price),
        trialDays: Number(form.trialDays) || 0,
      };
      if (editingId) {
        await api.updatePlan(session.token, editingId, body);
      } else {
        await api.createPlan(session.token, body);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan) {
    try {
      await api.setPlanStatus(session.token, plan.id, !plan.active);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Planes</h1>
          <p className="page-subtitle">
            Paquetes de aplicaciones que le vendés a una empresa: precio, ciclo de facturación
            y días de prueba gratis.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Nuevo plan
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {plans.length === 0 && !error && (
        <div className="empty-state">Todavía no creaste ningún plan.</div>
      )}

      <div className="grid">
        {plans.map((plan) => (
          <div className="app-badge-card" key={plan.id}>
            <span className="app-badge-code">{plan.code}</span>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="plan-card-price">
              ${plan.price} <span>{BILLING_LABELS[plan.billingCycle]}</span>
            </div>
            {plan.trialDays > 0 && (
              <p style={{ color: 'var(--ok)', fontSize: '0.85rem' }}>
                {plan.trialDays} días de prueba gratis
              </p>
            )}
            <div className="plan-card-apps">
              {plan.applications.map((app) => (
                <span className="plan-mini-badge" key={app.id}>{app.name}</span>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`status-pill ${plan.active ? 'active' : 'inactive'}`}>
                <span className="dot" />
                {plan.active ? 'Disponible' : 'Deshabilitado'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => openEdit(plan)}>Editar</button>
                <button className="btn-secondary" onClick={() => toggleActive(plan)}>
                  {plan.active ? 'Deshabilitar' : 'Habilitar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Editar plan' : 'Nuevo plan'}</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Código</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Precio</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Ciclo de facturación</label>
                  <select
                    value={form.billingCycle}
                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="ANUAL">Anual</option>
                    <option value="UNICO">Pago único</option>
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Días de prueba</label>
                  <input
                    type="number"
                    min="0"
                    value={form.trialDays}
                    onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Aplicaciones incluidas</label>
                <div className="checkbox-group">
                  {catalog.map((app) => (
                    <label key={app.id}>
                      <input
                        type="checkbox"
                        checked={form.applicationIds.includes(app.id)}
                        onChange={() => toggleApp(app.id)}
                      />
                      {app.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
