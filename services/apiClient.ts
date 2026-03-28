// API Client for CRM Master
// Handles communication with Supabase backend

const API_BASE = '/api';

// Get user name from localStorage
const getUserName = (): string => {
  const user = localStorage.getItem('crm_user');
  if (user) {
    const parsed = JSON.parse(user);
    return parsed.email || 'Unknown';
  }
  return localStorage.getItem('userName') || 'Unknown';
};

// Generic fetch wrapper
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Name': getUserName(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Customers API
export const customersApi = {
  getAll: () => fetchApi('/customers'),
  getById: (id: string) => fetchApi(`/customers?id=${id}`),
  create: (data: any) => fetchApi('/customers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => fetchApi(`/customers?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => fetchApi(`/customers?id=${id}`, {
    method: 'DELETE'
  })
};

// Samples API
export const samplesApi = {
  getAll: () => fetchApi('/samples'),
  getById: (id: string) => fetchApi(`/samples?id=${id}`),
  create: (data: any) => fetchApi('/samples', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => fetchApi(`/samples?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => fetchApi(`/samples?id=${id}`, {
    method: 'DELETE'
  })
};

// Exhibitions API
export const exhibitionsApi = {
  getAll: () => fetchApi('/exhibitions'),
  getById: (id: string) => fetchApi(`/exhibitions?id=${id}`),
  create: (data: any) => fetchApi('/exhibitions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => fetchApi(`/exhibitions?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => fetchApi(`/exhibitions?id=${id}`, {
    method: 'DELETE'
  })
};

// Expenses API
export const expensesApi = {
  getAll: () => fetchApi('/expenses'),
  getById: (id: string) => fetchApi(`/expenses?id=${id}`),
  create: (data: any) => fetchApi('/expenses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => fetchApi(`/expenses?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => fetchApi(`/expenses?id=${id}`, {
    method: 'DELETE'
  })
};

// FX Rates API
export const fxRatesApi = {
  getAll: () => fetchApi('/fx-rates'),
  getById: (id: string) => fetchApi(`/fx-rates?id=${id}`),
  create: (data: any) => fetchApi('/fx-rates', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => fetchApi(`/fx-rates?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => fetchApi(`/fx-rates?id=${id}`, {
    method: 'DELETE'
  })
};
