// Browser requests must stay on the same ALB origin as the page. This prevents
// a cached or stale build-time ALB hostname from breaking the API after an ALB
// replacement. Server-side callers may still use the configured API URL.
const API_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL ?? '/api');

// Resolve any stored file path to a browser-fetchable URL.
// New uploads return a full S3 https:// URL — return those as-is.
// Legacy paths (e.g. /uploads/avatar.jpg) are prefixed with the API root so
// the ALB rule (/api/*) routes the request to the backend container.
export function getFileUrl(p: string | null | undefined): string {
  if (!p) return '';
  if (p.startsWith('http')) return p;          // S3 absolute URL
  return `${API_URL}${p.startsWith('/') ? p : '/' + p}`;  // legacy relative path
}

// Kept for any remaining template-literal callers; new code should use getFileUrl().
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
