import React, { useEffect, useState } from 'react'
import { getDrivers } from '../lib/api'

export default function Search() {
  const [borough, setBorough] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [drivers, setDrivers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    try {
      setLoading(true)
      const res = await getDrivers({ borough: borough || undefined, search: search || undefined, page, limit })
      setDrivers(res.data)
      setTotal(res.total)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit])

  function submit(e) { e.preventDefault(); setPage(1); load() }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-sm">Borough</label>
          <select value={borough} onChange={e => setBorough(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            <option>Bronx</option>
            <option>Brooklyn</option>
            <option>Manhattan</option>
            <option>Queens</option>
            <option>Staten Island</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Name</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name" className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Page Size</label>
          <select value={limit} onChange={e => setLimit(parseInt(e.target.value))} className="border rounded px-2 py-1">
            {[10,25,50,100,200].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button className="ml-auto bg-blue-600 text-white px-3 py-2 rounded">Apply</button>
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="py-2 pr-4">License</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Borough</th>
                <th className="py-2 pr-4">Base</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.license_number} className="border-t">
                  <td className="py-2 pr-4">{d.license_number}</td>
                  <td className="py-2 pr-4">{d.driver_name}</td>
                  <td className="py-2 pr-4">{d.borough || '—'}</td>
                  <td className="py-2 pr-4">{d.base_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
        <div>Page {page} / {totalPages}</div>
        <button disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}
