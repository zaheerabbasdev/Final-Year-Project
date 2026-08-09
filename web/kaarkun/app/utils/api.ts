// NEXT_PUBLIC_API_URL is baked in at build time (both dev and prod Docker builds).
// Falls back to the relative /api path when not set (ALB routes /api/* to backend).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

// Prepend this to stored file paths (e.g. /uploads/avatar.jpg) to get a
// browser-fetchable URL.  We keep the /api suffix so the result becomes
// /api/uploads/avatar.jpg — the ALB path rule (/api/*) then forwards the
// request to the backend container, which serves /api/uploads as a static dir.
export const fileOrigin = API_URL;

interface RequestOptions extends RequestInit {
  body?: any;
}

function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

async function request(path: string, options: RequestOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Check if body is FormData, if not stringify as JSON
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: text };
  }

  if (response.status === 401) handleUnauthorized();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'POST', body }),
  put: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PUT', body }),
  patch: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'DELETE' }),
};
