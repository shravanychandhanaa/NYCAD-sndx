import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function BoroughChart({ data }) {
  const labels = data.map(d => d.borough || 'Unknown')
  const counts = data.map(d => d.count)

  const hasOnlyUnknown = data.length > 0 && data.every(d => (d.borough || 'Unknown') === 'Unknown')

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Drivers',
        data: counts,
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
      },
    ],
  }

  const options = { responsive: true, maintainAspectRatio: false }

  if (hasOnlyUnknown) {
    return (
      <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded border border-gray-200">
        Borough information is not provided by the source data. Showing "Unknown" only.
      </div>
    )
  }

  return (
    <div style={{ height: 320 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
