import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

export default function Layout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 bg-gray-100 p-6 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}