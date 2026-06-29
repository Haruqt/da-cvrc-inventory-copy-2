import { useState } from 'react'
import axios from 'axios'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) return setError('Please enter username and password')
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { username, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('username', res.data.username)
      onLogin(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/DA-CVRC LOGO.jpg"
            alt="DA-CVRC Logo"
            className="w-24 h-24 rounded-full object-cover border-4 border-green-700 shadow mb-4"
          />
          <h1 className="text-2xl font-bold text-green-800">DA-CVRC</h1>
          <p className="text-gray-500 text-sm mt-1">Inventory Management System</p>
          <p className="text-gray-400 text-xs mt-1">Department of Agriculture — CVRC</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-medium text-sm hover:bg-green-800 disabled:opacity-60 transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          DA-CVRC Inventory System © 2025
        </p>
      </div>
    </div>
  )
}