import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getSourceSample } from '../lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels)

export default function BoroughChart({ data }) {
  // Sort by count desc for readability
  const sorted = [...data]
    .map(d => ({ borough: d.borough || 'Unknown', count: d.count || 0 }))
    .sort((a, b) => b.count - a.count)
  const labels = sorted.map(d => d.borough)
  const counts = sorted.map(d => d.count)
  const total = counts.reduce((a, b) => a + b, 0)

  const hasOnlyUnknown = data.length > 0 && data.every(d => (d.borough || 'Unknown') === 'Unknown')

  const [sample, setSample] = useState([])
  const [sampleError, setSampleError] = useState(null)
  const [loadingSample, setLoadingSample] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!hasOnlyUnknown) return
      try {
        setLoadingSample(true)
        setSampleError(null)
        const res = await getSourceSample(10)
        if (!ignore) setSample(Array.isArray(res.sample) ? res.sample : [])
      } catch (e) {
        if (!ignore) setSampleError(e.message || 'Failed to load sample')
      } finally {
        if (!ignore) setLoadingSample(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [hasOnlyUnknown])

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Drivers',
        data: counts,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // horizontal bars for long labels
    scales: {
      x: {
        title: { display: true, text: 'Active Drivers' },
        beginAtZero: true,
        ticks: { precision: 0 }
      },
      y: {
        title: { display: true, text: 'Borough' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.x
            const pct = total ? ((val / total) * 100).toFixed(1) : 0
            return `${val} drivers (${pct}%)`
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'right',
        color: '#1f2937',
        formatter: (val) => {
          const pct = total ? ((val / total) * 100).toFixed(1) : 0
          return `${val} (${pct}%)`
        },
        clip: true
      }
    }
  }

  if (hasOnlyUnknown) {
    return (
      <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded border border-gray-200 space-y-3">
        <div>
          Borough information is not provided by the source data. Showing "Unknown" only.
        </div>
        <div className="text-gray-700">
          <div className="font-medium mb-2">Source sample (from NYC Open Data)</div>
          {loadingSample && <div className="text-gray-500">Loading sample…</div>}
          {sampleError && <div className="text-red-600">{sampleError}</div>}
          {!loadingSample && !sampleError && sample.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-[560px] w-full text-xs">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1 pr-3">License</th>
                    <th className="py-1 pr-3">Name</th>
                    <th className="py-1 pr-3">Type</th>
                    <th className="py-1 pr-3">Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-1 pr-3 whitespace-nowrap">{row.license_number || '—'}</td>
                      <td className="py-1 pr-3">{row.name || '—'}</td>
                      <td className="py-1 pr-3 whitespace-nowrap">{row.type || '—'}</td>
                      <td className="py-1 pr-3 whitespace-nowrap">{row.expiration_date ? new Date(row.expiration_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 360 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
