import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IirupPage from './pages/IirupPage'
import PpePage from './pages/PpePage'
import RpcppePage from './pages/RpcppePage'
import SuppliesPage from './pages/SuppliesPage'
import LoginPage from './pages/LoginPage'

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    if (token && username) setUser({ token, username })
    setChecking(false)
  }, [])

  const handleLogin = (data) => setUser(data)
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser(null)
  }

  if (checking) return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center">
      <p className="text-white text-lg">Loading...</p>
    </div>
  )

  if (!user) return <LoginPage onLogin={handleLogin} />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="iirup" element={<IirupPage />} />
          <Route path="ppe" element={<PpePage />} />
          <Route path="rpcppe" element={<RpcppePage />} />
          <Route path="supplies" element={<SuppliesPage pageType="supplies" />} />
          <Route path="agricultural" element={<SuppliesPage pageType="agricultural" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App