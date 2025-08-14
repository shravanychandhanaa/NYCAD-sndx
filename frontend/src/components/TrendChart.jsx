import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded border border-gray-200">
        Loading trend data...
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Active Drivers',
        data: data.map(item => item.totalDrivers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return ` ${context.parsed.y.toLocaleString()} drivers`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">30-Day Trend</h3>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
      {data.length > 1 && (
        <div className="mt-2 text-sm text-gray-600">
          {data[0].totalDrivers < data[data.length - 1].totalDrivers ? (
            <span className="text-green-600">
              ▲ {Math.round((data[data.length - 1].totalDrivers - data[0].totalDrivers) / data[0].totalDrivers * 100)}% increase over period
            </span>
          ) : (
            <span className="text-red-600">
              ▼ {Math.round((data[0].totalDrivers - data[data.length - 1].totalDrivers) / data[0].totalDrivers * 100)}% decrease over period
            </span>
          )}
        </div>
      )}
    </div>
  );
}
