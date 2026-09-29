// Tiny fetch wrapper for the local API (proxied by Vite to 127.0.0.1:4000).
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the store right now. Is NovaCart running?', 0, {});
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body = {}) => request(path, { method: 'POST', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export { ApiError };
