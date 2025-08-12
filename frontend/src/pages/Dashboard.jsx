import React, { useEffect, useState } from 'react'
import { getStats } from '../lib/api'
import BoroughChart from '../components/BoroughChart'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await getStats()
        setStats(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!stats) return null

  const lastUpdated = stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card md:col-span-1">
        <div className="text-sm text-gray-500">Total Active Drivers</div>
        <div className="text-3xl font-bold">{stats.totalActiveDrivers?.toLocaleString?.() ?? stats.totalActiveDrivers}</div>
        <div className="text-xs text-gray-500 mt-2">Last updated: {lastUpdated}</div>
      </div>
      <div className="card md:col-span-2">
        <div className="mb-2 font-medium">Borough Breakdown</div>
        <BoroughChart data={stats.byBorough || []} />
      </div>
    </div>
  )
}
