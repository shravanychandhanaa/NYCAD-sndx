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

  return (
    <div style={{ height: 320 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
