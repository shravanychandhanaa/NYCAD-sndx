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

export async function getDriverByLicense(license) {
  if (!license) throw new Error('License is required')
  const res = await fetch(`${API_BASE}/drivers/${encodeURIComponent(license)}`)
  if (res.status === 404) {
    return null
  }
  if (!res.ok) throw new Error('Failed to fetch driver')
  return res.json()
}

// Fetch a small sample of raw source records from backend proxy
// Used to reflect what the NYC API actually provides when boroughs are unknown
export async function getSourceSample(limit = 10) {
  const url = new URL(`${API_BASE}/source/sample`)
  url.searchParams.set('limit', String(Math.max(1, Math.min(limit, 50))))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch source sample')
  return res.json()
}
