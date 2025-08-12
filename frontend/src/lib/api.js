const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function getDrivers({ borough, search, page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams()
  if (borough) params.set('borough', borough)
  if (search) params.set('search', search)
  params.set('page', page)
  params.set('limit', limit)
  const res = await fetch(`${API_BASE}/drivers?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch drivers')
  return res.json()
}
