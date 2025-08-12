import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'

export default function App() {
  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-100'}`

  return (
    <div>
      <header className="bg-white border-b">
        <div className="container flex items-center justify-between h-14">
          <h1 className="text-lg font-semibold">NYC FHV Driver Dashboard</h1>
          <nav className="space-x-2">
            <NavLink to="/" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/search" className={navClass}>Search</NavLink>
          </nav>
        </div>
      </header>
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>
      <footer className="container py-6 text-sm text-gray-500">
        Data: NYC Open Data — FHV Active Drivers
      </footer>
    </div>
  )
}
