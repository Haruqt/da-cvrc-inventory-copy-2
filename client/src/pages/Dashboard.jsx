import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

const API = `${import.meta.env.VITE_API_URL}/api`
const currentYear = new Date().getFullYear()

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

export default function Dashboard() {
  const [counts, setCounts] = useState({ iirup: 0, ppe: 0, rpcppe: 0, supplies: 0, agricultural: 0 })
  const [supplyItems, setSupplyItems] = useState([])
  const [agriItems, setAgriItems] = useState([])
  const [iirupItems, setIirupItems] = useState([])
  const [rsmiRecords, setRsmiRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(currentYear)

  const SUPPLY_SECTIONS = ['Office Supplies', 'Printer Supplies', 'Batteries & Electronics']
  const AGRI_SECTIONS = ['Fertilizers', 'Chemicals / Pesticides', 'Seeds']

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [iirup, ppe, rpcppe, supplies, rsmi] = await Promise.all([
          axios.get(`${API}/iirup`, { params: { fiscal_year: year } }),
          axios.get(`${API}/ppe`, { params: { fiscal_year: year } }),
          axios.get(`${API}/rpcppe`, { params: { fiscal_year: year } }),
          axios.get(`${API}/supplies/items`, { params: { fiscal_year: year } }),
          axios.get(`${API}/supplies/rsmi`, { params: { fiscal_year: year } }),
        ])

        const allSupplies = supplies.data
        const supplyOnly = allSupplies.filter(i => SUPPLY_SECTIONS.includes(i.category))
        const agriOnly = allSupplies.filter(i => AGRI_SECTIONS.includes(i.category))

        setCounts({
          iirup: iirup.data.length,
          ppe: ppe.data.length,
          rpcppe: rpcppe.data.length,
          supplies: supplyOnly.length,
          agricultural: agriOnly.length,
        })
        setSupplyItems(supplyOnly)
        setAgriItems(agriOnly)
        setIirupItems(iirup.data)
        setRsmiRecords(rsmi.data)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    fetchAll()
  }, [year])

  // Supply by category for bar chart
  const supplyByCategory = SUPPLY_SECTIONS.map(cat => ({
    name: cat.replace(' Supplies', '').replace(' & Electronics', ''),
    total: supplyItems.filter(i => i.category === cat).length,
    inStock: supplyItems.filter(i => i.category === cat && i.balance > 0).length,
    outOfStock: supplyItems.filter(i => i.category === cat && i.balance <= 0).length,
  }))

  // Agri by category
  const agriByCategory = AGRI_SECTIONS.map(cat => ({
    name: cat.replace('Chemicals / ', ''),
    total: agriItems.filter(i => i.category === cat).length,
    inStock: agriItems.filter(i => i.category === cat && i.balance > 0).length,
  }))

  // IIRUP by category pie
  const iirupByCategory = Object.entries(
    iirupItems.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: name.replace('Agricultural & Forestry Equipment', 'AFE').replace('Office Equipment', 'Office Equip'), value }))

  // RSMI monthly trend
  const rsmiByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    const monthRecords = rsmiRecords.filter(r => r.date_issued?.startsWith(`${year}-${month}`))
    return {
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      issued: monthRecords.reduce((sum, r) => sum + (Number(r.quantity_issued) || 0), 0),
      amount: monthRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    }
  })

  // Low stock items
  const lowStockItems = [...supplyItems, ...agriItems]
    .filter(i => i.balance <= 5 && i.balance > 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 5)

  const outOfStockCount = [...supplyItems, ...agriItems].filter(i => i.balance <= 0).length
  const lowStockCount = [...supplyItems, ...agriItems].filter(i => i.balance <= 5 && i.balance > 0).length
  const totalRsmiAmount = rsmiRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  const summaryCards = [
    { label: 'IIRUP Items', value: counts.iirup, icon: '📋', color: 'bg-blue-600', sub: 'Unserviceable Property' },
    { label: 'PPE Items', value: counts.ppe, icon: '🔧', color: 'bg-green-600', sub: 'Property & Equipment' },
    { label: 'RPCPPE Items', value: counts.rpcppe, icon: '📦', color: 'bg-yellow-500', sub: 'Physical Count' },
    { label: 'Supply Items', value: counts.supplies, icon: '🗂️', color: 'bg-purple-600', sub: 'Office & Printer' },
    { label: 'Agri Items', value: counts.agricultural, icon: '🌱', color: 'bg-emerald-600', sub: 'Fertilizers & Seeds' },
    { label: 'Total Issued', value: `₱${totalRsmiAmount.toLocaleString()}`, icon: '📊', color: 'bg-red-500', sub: `${rsmiRecords.length} RSMI records` },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">DA-CVRC Inventory System Overview — {year}</p>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={year} onChange={e => setYear(Number(e.target.value))}>
          {Array.from({ length: 8 }, (_, i) => currentYear - 3 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-4 shadow-md`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs font-medium mt-1 opacity-90">{card.label}</p>
            <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Alert Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl p-4 flex items-center gap-4 ${outOfStockCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <span className="text-3xl">{outOfStockCount > 0 ? '🚨' : '✅'}</span>
          <div>
            <p className={`text-lg font-bold ${outOfStockCount > 0 ? 'text-red-700' : 'text-green-700'}`}>{outOfStockCount} Out of Stock</p>
            <p className="text-sm text-gray-500">Items with zero balance</p>
          </div>
        </div>
        <div className={`rounded-xl p-4 flex items-center gap-4 ${lowStockCount > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
          <span className="text-3xl">{lowStockCount > 0 ? '⚠️' : '✅'}</span>
          <div>
            <p className={`text-lg font-bold ${lowStockCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>{lowStockCount} Low Stock</p>
            <p className="text-sm text-gray-500">Items with 5 or less balance</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Supply Stock Bar Chart */}
        <div className="bg-white rounded-xl shadow p-5 md:col-span-2">
          <h3 className="text-base font-semibold text-gray-700 mb-4">📦 Supply Stock by Category</h3>
          {supplyByCategory.every(c => c.total === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No supply data for {year}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={supplyByCategory} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="inStock" name="In Stock" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outOfStock" name="Out of Stock" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* IIRUP Pie */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-700 mb-4">📋 IIRUP by Category</h3>
          {iirupByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No IIRUP data for {year}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={iirupByCategory} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {iirupByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* RSMI Monthly Trend */}
        <div className="bg-white rounded-xl shadow p-5 md:col-span-2">
          <h3 className="text-base font-semibold text-gray-700 mb-4">📊 RSMI Issuance Trend — {year}</h3>
          {rsmiRecords.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No RSMI data for {year}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rsmiByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="issued" name="Qty Issued" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Agricultural Pie */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-700 mb-4">🌱 Agricultural by Category</h3>
          {agriByCategory.every(c => c.total === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No agricultural data for {year}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={agriByCategory.filter(c => c.total > 0)} cx="50%" cy="50%" outerRadius={75} dataKey="total"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {agriByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Low Stock Alert Table */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-700 mb-4">⚠️ Low Stock Items (Top 5)</h3>
          {lowStockItems.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-green-600 text-sm font-medium">✅ All items are sufficiently stocked!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-yellow-50 text-yellow-800">
                  <th className="px-3 py-2 text-left text-xs">Item</th>
                  <th className="px-3 py-2 text-left text-xs">Category</th>
                  <th className="px-3 py-2 text-center text-xs">Balance</th>
                  <th className="px-3 py-2 text-center text-xs">Unit</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-medium text-gray-800 text-xs">{item.item_name}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{item.category}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">{item.balance}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-500 text-xs">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Summary Table */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-700 mb-4">📋 Quick Summary — {year}</h3>
          <div className="space-y-3">
            {[
              { icon: '📋', label: 'IIRUP Records', value: counts.iirup, color: 'text-blue-600' },
              { icon: '🔧', label: 'PPE Records', value: counts.ppe, color: 'text-green-600' },
              { icon: '📦', label: 'RPCPPE Records', value: counts.rpcppe, color: 'text-yellow-600' },
              { icon: '🗂️', label: 'Supply Items', value: counts.supplies, color: 'text-purple-600' },
              { icon: '🌱', label: 'Agricultural Items', value: counts.agricultural, color: 'text-emerald-600' },
              { icon: '📊', label: 'Total RSMI Issuances', value: rsmiRecords.length, color: 'text-red-600' },
              { icon: '💰', label: 'Total RSMI Amount', value: `₱${totalRsmiAmount.toLocaleString()}`, color: 'text-gray-700' },
              { icon: '🚨', label: 'Out of Stock Items', value: outOfStockCount, color: 'text-red-600' },
              { icon: '⚠️', label: 'Low Stock Items', value: lowStockCount, color: 'text-yellow-600' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{row.icon}</span>
                  <span className="text-sm text-gray-600">{row.label}</span>
                </div>
                <span className={`font-bold text-sm ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}