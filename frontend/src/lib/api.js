const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `BuyPal API error (${response.status})`);
    error.status = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

const get = path => request(path);
const post = (path, body, headers) => request(path, { method: 'POST', body, headers });
const patch = (path, body) => request(path, { method: 'PATCH', body });
const del = path => request(path, { method: 'DELETE' });

export const api = {
  dashboard: {
    summary: () => get('/dashboard/summary'),
  },
  wallet: {
    get: () => get('/wallet'),
    activity: () => get('/wallet/activity'),
    topUp: (data, idempotencyKey) => post('/wallet/topups', data, { 'Idempotency-Key': idempotencyKey }),
    withdraw: (data, idempotencyKey) => post('/wallet/withdrawals', data, { 'Idempotency-Key': idempotencyKey }),
    limits: data => patch('/wallet/limits', data),
  },
  paymentMethods: {
    list: () => get('/payment-methods'),
    link: data => post('/payment-methods/link', data),
    remove: id => del(`/payment-methods/${encodeURIComponent(id)}`),
  },
  payments: {
    createIntent: (data, idempotencyKey) => post('/payment-intents', data, { 'Idempotency-Key': idempotencyKey }),
    createReceiveRequest: data => post('/receive-requests', data),
  },
  contacts: {
    list: () => get('/contacts'),
  },
  circles: {
    list: () => get('/circles?mine=true'),
    get: id => get(`/circles/${encodeURIComponent(id)}`),
    create: data => post('/circles', data),
    invite: (id, data) => post(`/circles/${encodeURIComponent(id)}/invitations`, data),
    expenses: id => get(`/circles/${encodeURIComponent(id)}/expenses`),
    createExpense: (id, data) => post(`/circles/${encodeURIComponent(id)}/expenses`, data),
  },
  approvals: {
    list: status => get(`/approvals${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    decide: (id, decision) => post(`/approvals/${encodeURIComponent(id)}/decision`, { decision }),
  },
  shopping: {
    search: data => post('/ai/shopping/search', data),
    compare: data => post('/ai/shopping/compare', data),
    createPurchaseIntent: data => post('/purchase-intents', data),
    getPurchaseIntent: id => get(`/purchase-intents/${encodeURIComponent(id)}`),
    approvePurchase: id => post(`/purchase-intents/${encodeURIComponent(id)}/approve`, {}),
    cancelPurchase: id => post(`/purchase-intents/${encodeURIComponent(id)}/cancel`, {}),
    policy: data => patch('/shopping-policy', data),
  },
  transactions: {
    list: params => get(`/transactions${params ? `?${new URLSearchParams(params)}` : ''}`),
    get: id => get(`/transactions/${encodeURIComponent(id)}`),
    export: params => post('/transactions/export', params || {}),
  },
  analytics: {
    overview: () => get('/analytics/overview'),
    spending: period => get(`/analytics/spending?period=${encodeURIComponent(period || 'month')}`),
    categories: () => get('/analytics/categories'),
    merchants: () => get('/analytics/merchants'),
    insights: () => get('/analytics/insights'),
  },
  account: {
    me: () => get('/me'),
    update: data => patch('/me', data),
  },
  notifications: {
    list: () => get('/notifications'),
    markRead: id => patch(`/notifications/${encodeURIComponent(id)}/read`, {}),
    preferences: () => get('/notifications/preferences'),
    updatePreferences: data => patch('/notifications/preferences', data),
  },
};

export { request };
