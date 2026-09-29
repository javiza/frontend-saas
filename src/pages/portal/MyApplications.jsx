import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../components/portal/ClientLayout';

const STATUS_LABELS = {
  TRIAL: 'En prueba',
  ACTIVE: 'Activa',
  EXPIRED: 'Vencida',
  CANCELED: 'Dada de baja',
};

const STATUS_CLASS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
};

const LIVE_STATUSES = ['TRIAL', 'ACTIVE'];

export default function MyApplications() {
  const { session } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [appAccess, setAppAccess] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  function load() {
    // Nota: companyId viene del propio JWT (session.companyId), nunca de
    // la URL. El backend además valida esto server-side, así que aunque
    // alguien manipulara el request, seguiría sin poder ver otra empresa.
    Promise.all([
      api.getCompanySubscriptions(session.token, session.companyId),
      api.getCompanyApplications(session.token, session.companyId),
    ])
      .then(([subs, apps]) => {
        setSubscriptions(subs);
        setAppAccess(apps);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [session.token, session.companyId]);

  const activeAccess = appAccess.filter((s) => s.active);
  const inactiveAccess = appAccess.filter((s) => !s.active);

  async function handleCancel(subscriptionId) {
    setCancelingId(subscriptionId);
    setError('');
    try {
      await api.cancelSubscription(session.token, session.companyId, subscriptionId);
      setConfirmCancel(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <ClientLayout>
      <div className="page-header">
        <div>
          <h1>Mis aplicaciones</h1>
          <p className="page-subtitle">
            Lo que tu empresa tiene contratado y el acceso vigente a cada app.
          </p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {!loading && subscriptions.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            Tu empresa todavía no tiene nada contratado.{' '}
            <Link to="/portal/catalogo">Mirá el catálogo</Link> para empezar una
            prueba gratis.
          </div>
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="grid" style={{ marginBottom: 28 }}>
          {subscriptions.map((sub) => {
            const isLive = LIVE_STATUSES.includes(sub.status);
            const dateLabel = sub.status === 'TRIAL' ? 'Prueba gratis vence' : 'Próximo cobro';
            const dateValue = sub.status === 'TRIAL' ? sub.trialEndsAt : sub.currentPeriodEnd;

            return (
              <div className="app-badge-card" key={sub.id}>
                <span className="app-badge-code">{sub.planCode}</span>
                <h3>{sub.planName}</h3>
                <p>
                  {isLive && dateValue
                    ? `${dateLabel}: ${new Date(dateValue).toLocaleDateString()}`
                    : sub.status === 'CANCELED' && sub.canceledAt
                    ? `Dada de baja el ${new Date(sub.canceledAt).toLocaleDateString()}`
                    : 'Sin fecha de vencimiento'}
                </p>
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className={`status-pill ${STATUS_CLASS[sub.status]}`}>
                    <span className="dot" />
                    {STATUS_LABELS[sub.status]}
                  </span>
                  {isLive && (
                    <button
                      className="btn-secondary"
                      onClick={() => setConfirmCancel(sub)}
                      disabled={cancelingId === sub.id}
                    >
                      Dar de baja
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {appAccess.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.05rem' }}>Acceso a aplicaciones</h2>
          {activeAccess.length > 0 && (
            <div className="grid">
              {activeAccess.map((sub) => (
                <div className="app-badge-card" key={sub.id}>
                  <span className="app-badge-code">{sub.applicationCode}</span>
                  <h3>{sub.applicationName}</h3>
                  <p>
                    {sub.expiresAt
                      ? `Vence: ${new Date(sub.expiresAt).toLocaleDateString()}`
                      : 'Sin fecha de vencimiento'}
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <span className="status-pill active">
                      <span className="dot" />
                      Activa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inactiveAccess.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.05rem', marginTop: 28 }}>Sin acceso</h2>
              <div className="grid">
                {inactiveAccess.map((sub) => (
                  <div className="app-badge-card" key={sub.id}>
                    <span className="app-badge-code">{sub.applicationCode}</span>
                    <h3>{sub.applicationName}</h3>
                    <div style={{ marginTop: 12 }}>
                      <span className="status-pill inactive">
                        <span className="dot" />
                        Desactivada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {confirmCancel && (
        <div className="modal-overlay" onClick={() => setConfirmCancel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>¿Dar de baja "{confirmCancel.planName}"?</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              Se cancela ahora mismo: no se te va a cobrar de nuevo y vas a perder
              el acceso a las aplicaciones incluidas en este plan. Esta acción no
              se puede deshacer; si más adelante querés volver a usarla, tenés que
              contratarla de nuevo desde el catálogo.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmCancel(null)}>
                Volver
              </button>
              <button
                className="btn-primary"
                onClick={() => handleCancel(confirmCancel.id)}
                disabled={cancelingId === confirmCancel.id}
              >
                {cancelingId === confirmCancel.id ? 'Dando de baja…' : 'Sí, dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
