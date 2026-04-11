export const api = {
  baseUrl: 'http://localhost:5000/api',
  
  async get(endpoint: string, token?: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('API request failed');
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
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async delete(endpoint: string, token?: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  }
};
