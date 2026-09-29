import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../components/portal/ClientLayout';

const BILLING_LABELS = {
  MENSUAL: '/ mes',
  ANUAL: '/ año',
  UNICO: 'pago único',
};

const LIVE_STATUSES = ['TRIAL', 'ACTIVE'];

function formatPrice(price) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
}

// Catálogo en dos pasos: primero la app (nombre + descripción, que es lo
// que el cliente entiende y usa), y recién al elegirla se muestran los
// planes que la incluyen —normalmente uno solo— con su precio, días de
// prueba y ciclo de cobro, para contratar.
export default function Catalog() {
  const { session } = useAuth();
  const [applications, setApplications] = useState([]);
  const [companyApps, setCompanyApps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [selectedApp, setSelectedApp] = useState(null); // detalle de la app
  const [confirmPlan, setConfirmPlan] = useState(null); // plan a contratar
  const [subscribing, setSubscribing] = useState(false);

  const [needsCard, setNeedsCard] = useState(false);
  const [cardEmail, setCardEmail] = useState(session?.email || '');
  const [startingInscription, setStartingInscription] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.getApplications(session.token),
      api.getCompanyApplications(session.token, session.companyId),
      api.getPlans(session.token),
      api.getCompanySubscriptions(session.token, session.companyId),
    ])
      .then(([apps, myApps, allPlans, subs]) => {
        setApplications(apps);
        setCompanyApps(myApps);
        setPlans(allPlans);
        setSubscriptions(subs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [session.token, session.companyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setNotice('Tarjeta registrada correctamente. Ya podés contratar la app que quieras.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('payment') === 'error') {
      setError('No pudimos registrar la tarjeta. Intentá de nuevo.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Apps con acceso vigente (ya contratadas y activas): no tiene sentido
  // volver a ofrecerlas en el catálogo.
  const activeAppIds = companyApps.filter((a) => a.active).map((a) => a.applicationId);
  const availableApps = applications.filter((app) => app.active && !activeAppIds.includes(app.id));

  const livePlanIds = subscriptions
    .filter((s) => LIVE_STATUSES.includes(s.status))
    .map((s) => s.planId);

  // Planes que incluyen la app seleccionada y todavía no están contratados.
  const plansForSelectedApp = selectedApp
    ? plans.filter(
        (p) => p.active && !livePlanIds.includes(p.id) && p.applications.some((a) => a.id === selectedApp.id)
      )
    : [];

  async function confirmSubscribe() {
    setSubscribing(true);
    setError('');
    try {
      await api.subscribeToPlan(session.token, session.companyId, confirmPlan.id);
      setConfirmPlan(null);
      setSelectedApp(null);
      setNeedsCard(false);
      setNotice(
        confirmPlan.trialDays > 0
          ? `¡Listo! "${selectedApp?.name}" está activa con ${confirmPlan.trialDays} días de prueba gratis.`
          : `¡Listo! "${selectedApp?.name}" está activa.`
      );
      load();
    } catch (err) {
      if (err.status === 402) {
        // Sin tarjeta registrada: no cerramos el modal, mostramos el paso
        // de registrar tarjeta primero.
        setNeedsCard(true);
      } else {
        setError(err.message);
      }
    } finally {
      setSubscribing(false);
    }
  }

  async function startCardRegistration(e) {
    e.preventDefault();
    setStartingInscription(true);
    setError('');
    try {
      const { token, urlWebpay } = await api.startPaymentInscription(
        session.token,
        session.companyId,
        cardEmail
      );

      // Transbank exige un POST (auto-submit de formulario) con
      // TBK_TOKEN=token hacia urlWebpay; no es algo que se pueda hacer
      // con fetch, tiene que ser una navegación real del browser.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = urlWebpay;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'TBK_TOKEN';
      input.value = token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err.message);
      setStartingInscription(false);
    }
  }

  return (
    <ClientLayout>
      <div className="page-header">
        <div>
          <h1>Catálogo</h1>
          <p className="page-subtitle">
            Aplicaciones disponibles para tu empresa. Elegí una para ver su
            descripción y contratarla: todas parten con período de prueba
            gratuito y después se cobra mensual, hasta que decidas dar de baja.
          </p>
        </div>
      </div>

      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && availableApps.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            {applications.length === 0
              ? 'Todavía no hay aplicaciones publicadas en el catálogo.'
              : 'Ya tenés acceso a todas las aplicaciones disponibles.'}
          </div>
        </div>
      )}

      <div className="grid">
        {availableApps.map((app) => (
          <div className="app-badge-card" key={app.id}>
            <span className="app-badge-code">{app.code}</span>
            <h3>{app.name}</h3>
            <p>{app.description}</p>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedApp(app);
                  setNeedsCard(false);
                  setConfirmPlan(null);
                  setError('');
                }}
              >
                Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedApp && (
        <div className="modal-overlay" onClick={() => !subscribing && setSelectedApp(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {!confirmPlan ? (
              <>
                <h2>{selectedApp.name}</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  {selectedApp.description}
                </p>

                {plansForSelectedApp.length === 0 ? (
                  <div className="empty-state" style={{ marginTop: 12 }}>
                    Esta aplicación no tiene ningún plan disponible para contratar
                    en este momento.
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize: '0.95rem', marginTop: 20, marginBottom: 10 }}>
                      Elegí cómo contratarla
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plansForSelectedApp.map((plan) => (
                        <div key={plan.id} className="card" style={{ padding: 14 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <div>
                              <strong>{plan.name}</strong>
                              {plan.applications.length > 1 && (
                                <p style={{ margin: '2px 0 0', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                  Incluye también: {plan.applications
                                    .filter((a) => a.id !== selectedApp.id)
                                    .map((a) => a.name)
                                    .join(', ')}
                                </p>
                              )}
                              <div style={{ marginTop: 6 }}>
                                <strong>{formatPrice(plan.price)}</strong>{' '}
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                  {BILLING_LABELS[plan.billingCycle]}
                                </span>
                                {plan.trialDays > 0 && (
                                  <span className="status-pill trial" style={{ marginLeft: 8 }}>
                                    <span className="dot" />
                                    {plan.trialDays} días gratis
                                  </span>
                                )}
                              </div>
                            </div>
                            <button className="btn-primary" onClick={() => setConfirmPlan(plan)}>
                              Contratar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setSelectedApp(null)}>
                    Cerrar
                  </button>
                </div>
              </>
            ) : !needsCard ? (
              <>
                <h2>Contratar "{selectedApp.name}"</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  {confirmPlan.trialDays > 0 ? (
                    <>
                      Empezás con <strong>{confirmPlan.trialDays} días de prueba gratis</strong>.
                      Cuando termine, se cobrarán {formatPrice(confirmPlan.price)}{' '}
                      {BILLING_LABELS[confirmPlan.billingCycle]} automáticamente a tu
                      tarjeta registrada. Podés dar de baja cuando quieras antes de esa
                      fecha y no se te cobrará nada.
                    </>
                  ) : (
                    <>
                      Se cobrarán {formatPrice(confirmPlan.price)}{' '}
                      {BILLING_LABELS[confirmPlan.billingCycle]} a tu tarjeta registrada.
                      Podés dar de baja cuando quieras.
                    </>
                  )}
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmPlan(null)}
                    disabled={subscribing}
                  >
                    Volver
                  </button>
                  <button className="btn-primary" onClick={confirmSubscribe} disabled={subscribing}>
                    {subscribing ? 'Contratando…' : 'Confirmar y contratar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Registrá una tarjeta primero</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  Para contratar "{selectedApp.name}" tu empresa necesita una tarjeta
                  registrada (se usa para cobrar la renovación cuando termine la
                  prueba gratis). Te vamos a redirigir a Transbank para ingresarla de
                  forma segura; no volvemos a pedirte los datos después.
                </p>
                <form onSubmit={startCardRegistration}>
                  <div className="field">
                    <label>Email de contacto</label>
                    <input
                      type="email"
                      value={cardEmail}
                      onChange={(e) => setCardEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setNeedsCard(false)}
                      disabled={startingInscription}
                    >
                      Volver
                    </button>
                    <button className="btn-primary" type="submit" disabled={startingInscription}>
                      {startingInscription ? 'Redirigiendo…' : 'Continuar a Transbank'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
