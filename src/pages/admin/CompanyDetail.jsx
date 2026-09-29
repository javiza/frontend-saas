import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

const PLAN_STATUS_LABELS = {
  TRIAL: 'En prueba',
  ACTIVE: 'Activa',
  EXPIRED: 'Vencida',
  CANCELED: 'Cancelada',
};

const PLAN_STATUS_CLASS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
};

const BILLING_LABELS = {
  MENSUAL: '/ mes',
  ANUAL: '/ año',
  UNICO: 'pago único',
};

export default function CompanyDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [planSubs, setPlanSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  function load() {
    Promise.all([
      api.getCompanyApplications(session.token, id),
      api.getApplications(session.token),
      api.getCompanySubscriptions(session.token, id),
      api.getPlans(session.token),
    ])
      .then(([subs, apps, planSubscriptions, allPlans]) => {
        setSubscriptions(subs);
        setCatalog(apps);
        setPlanSubs(planSubscriptions);
        setPlans(allPlans);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [session.token, id]);

  const livePlanIds = planSubs
    .filter((s) => s.status === 'TRIAL' || s.status === 'ACTIVE')
    .map((s) => s.planId);
  const availablePlans = plans.filter((p) => p.active && !livePlanIds.includes(p.id));

  async function handleSubscribePlan(e) {
    e.preventDefault();
    setSavingPlan(true);
    setError('');
    try {
      await api.subscribeToPlan(session.token, id, selectedPlan);
      setShowPlanModal(false);
      setSelectedPlan('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleCancelPlan(subscriptionId) {
    try {
      await api.cancelSubscription(session.token, id, subscriptionId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

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
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>{subscriptions[0]?.companyName || planSubs[0]?.companyName || 'Empresa'}</h1>
          <p className="page-subtitle">Planes y aplicaciones contratadas por esta empresa.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Planes contratados</h2>
        <button
          className="btn-primary"
          onClick={() => setShowPlanModal(true)}
          disabled={availablePlans.length === 0}
        >
          + Contratar plan
        </button>
      </div>

      {planSubs.length === 0 ? (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="empty-state">Esta empresa todavía no tiene ningún plan contratado.</div>
        </div>
      ) : (
        <div className="grid" style={{ marginBottom: 28 }}>
          {planSubs.map((sub) => {
            const isLive = sub.status === 'TRIAL' || sub.status === 'ACTIVE';
            const dateLabel = sub.status === 'TRIAL' ? 'Prueba vence' : 'Vence';
            const dateValue = sub.status === 'TRIAL' ? sub.trialEndsAt : sub.currentPeriodEnd;
            return (
              <div className="app-badge-card" key={sub.id}>
                <span className="app-badge-code">{sub.planCode}</span>
                <h3>{sub.planName}</h3>
                <p>
                  {dateValue
                    ? `${dateLabel}: ${new Date(dateValue).toLocaleDateString()}`
                    : 'Sin fecha de vencimiento'}
                </p>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`status-pill ${PLAN_STATUS_CLASS[sub.status]}`}>
                    <span className="dot" />
                    {PLAN_STATUS_LABELS[sub.status]}
                  </span>
                  {isLive && (
                    <button className="btn-secondary" onClick={() => handleCancelPlan(sub.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Aplicaciones individuales</h2>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          disabled={availableToAssign.length === 0}
        >
          + Vender aplicación
        </button>
      </div>

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

      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Contratar plan</h2>
            <form onSubmit={handleSubscribePlan}>
              <div className="field">
                <label>Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  required
                >
                  <option value="" disabled>Elegí un plan</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ${plan.price} {BILLING_LABELS[plan.billingCycle]}
                      {plan.trialDays > 0 ? ` (${plan.trialDays} días de prueba)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPlanModal(false)}
                >
                  Cancelar
                </button>
                <button className="btn-primary" type="submit" disabled={savingPlan}>
                  {savingPlan ? 'Contratando…' : 'Contratar'}
                </button>
              </div>
            </form>
          </div>
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
    </AdminLayout>
  );
}
