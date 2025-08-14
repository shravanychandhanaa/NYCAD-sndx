import React, { useState } from 'react'
import { getDriverByLicense } from '../lib/api'

export default function Search() {
  const [license, setLicense] = useState('')
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function formatDate(val) {
    if (!val) return '—'
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleString()
    } catch {
      return String(val)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setDriver(null)
    const value = license.trim()
    if (!value) {
      setError('Please enter a driver license number')
      return
    }
    try {
      setLoading(true)
      const res = await getDriverByLicense(value)
      if (!res) {
        setError('No driver found for that license number')
      } else {
        setDriver(res)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-sm">Driver License Number</label>
          <input
            value={license}
            onChange={e => setLicense(e.target.value)}
            placeholder="e.g. 1234567"
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <button className="ml-auto bg-blue-600 text-white px-3 py-2 rounded" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="card">
        {error && <div className="text-red-600">{error}</div>}
        {!error && !driver && <div className="text-gray-600">Enter a license number and click Search.</div>}
        {driver && (
          <div className="text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">License</th><td className="py-2">{driver.license_number}</td></tr>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Name</th><td className="py-2">{driver.driver_name || '—'}</td></tr>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Active</th><td className="py-2">{driver.active ? 'Yes' : 'No'}</td></tr>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Borough</th><td className="py-2">{driver.borough || '—'}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Base Name</th><td className="py-2">{driver.base_name || '—'}</td></tr>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Base Number</th><td className="py-2">{driver.base_number || '—'}</td></tr>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Dataset Last Updated</th><td className="py-2">{formatDate(driver.dataset_last_updated)}</td></tr>
                    <tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">Record Updated At</th><td className="py-2">{formatDate(driver.updated_at)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            {driver.raw && (
              <details className="mt-4">
                <summary className="cursor-pointer text-gray-700">Raw Source Record</summary>
                <pre className="mt-2 p-3 bg-gray-50 border rounded overflow-auto text-xs">{JSON.stringify(driver.raw, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
