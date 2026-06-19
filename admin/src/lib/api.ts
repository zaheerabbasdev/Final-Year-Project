function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

async function parseError(res: Response) {
  try {
    const error = await res.json();
    return error.message || 'API request failed';
  } catch {
    return `API request failed (${res.status})`;
  }
}

// Origin (no /api suffix) for static asset URLs like /uploads/<file>
export const fileOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const api = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',

  async get(endpoint: string, token?: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.status === 401) handleUnauthorized();
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async post(endpoint: string, data: any, token?: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.status === 401) handleUnauthorized();
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async put(endpoint: string, data: any, token?: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.status === 401) handleUnauthorized();
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async delete(endpoint: string, token?: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.status === 401) handleUnauthorized();
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  }
};
