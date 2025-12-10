const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) return res.json()
  return res.text()
}

export async function devLogin(email: string) {
  return request('/auth/dev-login', { method: 'POST', body: JSON.stringify({ email }) })
}

export async function refresh(refresh: string) {
  return request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh }) })
}

export async function listChildren(folderId: string | number) {
  return request(`/folders/${folderId}/children`)
}

export async function createFolder(name: string, parentId?: string | number) {
  return request(`/folders`, { method: 'POST', body: JSON.stringify({ name, parentId }) })
}

