import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/iirup', label: 'IIRUP / IIRUSP', icon: '📋' },
  { to: '/ppe', label: 'PPE / Semi-expendable', icon: '🔧' },
  { to: '/rpcppe', label: 'RPCPPE', icon: '📦' },
  { to: '/supplies', label: 'Supplies', icon: '🗂️' },
  { to: '/agricultural', label: 'Agricultural', icon: '🌱' },
]

export default function Sidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ width: collapsed ? '64px' : '240px', transition: 'width 0.3s' }}
      className="min-h-screen bg-green-800 text-white flex flex-col relative flex-shrink-0">

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 bg-green-600 hover:bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20 text-xs font-bold border-2 border-white">
        {collapsed ? '›' : '‹'}
      </button>

      <div className={`p-4 border-b border-green-700 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <img src="/DA-CVRC LOGO.jpg" alt="DA-CVRC Logo"
          className="w-10 h-10 rounded-full object-cover border-2 border-green-400 flex-shrink-0" />
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold leading-tight">DA-CVRC</h1>
            <p className="text-green-300 text-xs">Inventory System</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'} title={link.label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg text-sm transition-colors
              ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
              ${isActive ? 'bg-white text-green-800 font-semibold' : 'text-green-100 hover:bg-green-700'}`
            }>
            <span className="text-lg flex-shrink-0">{link.icon}</span>
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-green-700">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 mb-2 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-green-400 text-xs">Administrator</p>
              </div>
            </div>
            <button onClick={onLogout}
              className="w-full bg-green-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg transition-colors font-medium">
              🚪 Sign Out
            </button>
            <p className="text-center text-xs text-green-400 mt-2">DA-CVRC © 2025</p>
          </>
        ) : (
          <button onClick={onLogout} title="Sign Out"
            className="w-full flex justify-center items-center bg-green-700 hover:bg-red-600 text-white py-2 rounded-lg transition-colors">
            🚪
          </button>
        )}
      </div>
    </div>
  )
}