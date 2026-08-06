const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment && process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api';

// Origin (no /api suffix) for static asset URLs like /uploads/<file>
export const fileOrigin = API_URL.replace(/\/api\/?$/, '');

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
