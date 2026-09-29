const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message || `Error ${res.status}`;
    const error = new Error(message);
    // Se usa, por ejemplo, para distinguir un 402 (falta tarjeta) de otros
    // errores al contratar un plan, sin tener que parsear el mensaje.
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  register: ({ companyName, companyEmail, name, email, password }) =>
    request('/api/auth/register', {
      method: 'POST',
      body: { companyName, companyEmail, name, email, password },
    }),

  getCompanies: (token) => request('/api/companies', { token }),
  createCompany: (token, body) =>
    request('/api/companies', { method: 'POST', body, token }),

  getApplications: (token) => request('/api/applications', { token }),
  createApplication: (token, body) =>
    request('/api/applications', { method: 'POST', body, token }),

  getCompanyApplications: (token, companyId) =>
    request(`/api/companies/${companyId}/applications`, { token }),

  assignApplication: (token, companyId, applicationId, expiresAt) =>
    request(`/api/companies/${companyId}/applications`, {
      method: 'POST',
      token,
      body: { applicationId, expiresAt: expiresAt || null },
    }),

  setApplicationStatus: (token, companyId, applicationId, active) =>
    request(
      `/api/companies/${companyId}/applications/${applicationId}/status?active=${active}`,
      { method: 'PATCH', token }
    ),

  // Planes (paquetes de aplicaciones con precio, ciclo y días de prueba)
  getPlans: (token) => request('/api/plans', { token }),
  createPlan: (token, body) =>
    request('/api/plans', { method: 'POST', body, token }),
  updatePlan: (token, planId, body) =>
    request(`/api/plans/${planId}`, { method: 'PUT', body, token }),
  setPlanStatus: (token, planId, active) =>
    request(`/api/plans/${planId}/status?active=${active}`, { method: 'PATCH', token }),

  // Suscripciones de empresas a planes (maneja trial / activa / vencida)
  getCompanySubscriptions: (token, companyId) =>
    request(`/api/companies/${companyId}/subscriptions`, { token }),
  subscribeToPlan: (token, companyId, planId) =>
    request(`/api/companies/${companyId}/subscriptions`, {
      method: 'POST',
      token,
      body: { planId },
    }),
  cancelSubscription: (token, companyId, subscriptionId) =>
    request(`/api/companies/${companyId}/subscriptions/${subscriptionId}/cancel`, {
      method: 'PATCH',
      token,
    }),
  getAllSubscriptions: (token, status) =>
    request(`/api/subscriptions${status ? `?status=${status}` : ''}`, { token }),
  getTrialsEndingSoon: (token) =>
    request('/api/subscriptions/trials-ending-soon', { token }),

  // Tarjeta guardada (Oneclick Transbank) requerida para contratar un plan.
  getPaymentMethod: (token, companyId) =>
    request(`/api/companies/${companyId}/payment-methods`, { token }),
  startPaymentInscription: (token, companyId, email) =>
    request(`/api/companies/${companyId}/payment-methods/start`, {
      method: 'POST',
      token,
      body: { email },
    }),
  finishPaymentInscription: (token, companyId, webpayToken) =>
    request(`/api/companies/${companyId}/payment-methods/finish`, {
      method: 'POST',
      token,
      body: { token: webpayToken },
    }),
};
