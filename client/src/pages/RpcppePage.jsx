import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { getYearOptions } from '../utils/years'

const API = `${import.meta.env.VITE_API_URL}/api/rpcppe`
const FUND_CLUSTERS = ['Fund 01 - Regular', 'Fund 07 - Trust', 'RPCSP - Semi-expendable']
const PPE_TYPES = [
  'Land', 'Other Land Improvements', 'Road Networks', 'Water Supply Systems',
  'Power Supply Systems', 'Buildings', 'Other Structures', 'Office Equipment',
  'Information & Communication Technology', 'Agricultural & Forestry Equipment',
  'Technical & Scientific Equipment', 'Motor Vehicles', 'Furniture & Fixtures', 'Other Equipment'
]
const currentYear = new Date().getFullYear()
const PER_PAGE = 15

const emptyForm = {
  article_no: '', description: '', property_number: '', unit_of_measure: '',
  unit_value: '', balance_per_card: '', on_hand_per_count: '',
  remarks: '', accountable_person: '', date_acquired: '', location: '',
  ppe_type: '', fund_cluster: '', report_date: '', fiscal_year: currentYear
}

const emptyBulkRow = {
  article_no: '', description: '', property_number: '', unit_of_measure: '',
  unit_value: '', balance_per_card: '', on_hand_per_count: '',
  accountable_person: '', ppe_type: '', fund_cluster: ''
}

// Derived, never stored from user input directly — always on_hand - balance
function deriveShortage(onHand, balance) {
  const h = Number(onHand) || 0
  const b = Number(balance) || 0
  return h - b
}

function SortHeader({ label, field, sortField, sortDir, onSort, align = 'left' }) {
  const isActive = sortField === field
  return (
    <th className={`px-4 py-3 cursor-pointer select-none hover:bg-green-600 transition-colors text-${align}`}
      onClick={() => onSort(field)}>
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <span className="text-xs opacity-70">
          {isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
        </span>
      </div>
    </th>
  )
}

function ShortagePill({ value }) {
  if (value === null || value === undefined || value === '') return <span className="text-gray-400">—</span>
  const num = Number(value)
  if (num === 0) return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">0</span>
  if (num < 0) return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{num}</span>
  return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">+{num}</span>
}

export default function RpcppePage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFund, setFilterFund] = useState('')
  const [filterYear, setFilterYear] = useState(currentYear)
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const [bulkRows, setBulkRows] = useState(Array(5).fill(null).map(() => ({ ...emptyBulkRow })))
  const [pasteText, setPasteText] = useState('')
  const [pastePreview, setPastePreview] = useState([])
  const [pasteUnmatched, setPasteUnmatched] = useState([])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterType) params.ppe_type = filterType
      if (filterFund) params.fund_cluster = filterFund
      if (filterYear) params.fiscal_year = filterYear
      const res = await axios.get(API, { params })
      setItems(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchItems(); setPage(1) }, [search, filterType, filterFund, filterYear])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedItems = useMemo(() => {
    if (!sortField) return items
    return [...items].sort((a, b) => {
      let av = a[sortField] ?? ''
      let bv = b[sortField] ?? ''
      if (sortField === 'shortage_overage') {
        av = deriveShortage(a.on_hand_per_count, a.balance_per_card)
        bv = deriveShortage(b.on_hand_per_count, b.balance_per_card)
      }
      const cmp = typeof av === 'number' || typeof bv === 'number'
        ? (Number(av) || 0) - (Number(bv) || 0)
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortField, sortDir])

  const totalPages = Math.ceil(sortedItems.length / PER_PAGE)
  const paged = sortedItems.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Stat cards data
  const totalValue = items.reduce((sum, i) => sum + (Number(i.unit_value) || 0), 0)
  const shortageCount = items.filter(i => deriveShortage(i.on_hand_per_count, i.balance_per_card) < 0).length
  const overageCount = items.filter(i => deriveShortage(i.on_hand_per_count, i.balance_per_card) > 0).length

  const openAdd = () => { setForm({ ...emptyForm, fiscal_year: filterYear || currentYear }); setEditId(null); setShowModal(true) }
  const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.description) return alert('Description is required!')
    try {
      if (editId) await axios.put(`${API}/${editId}`, form)
      else await axios.post(API, form)
      setShowModal(false)
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    await axios.delete(`${API}/${id}`)
    fetchItems()
  }

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.description)
    if (!valid.length) return alert('At least one row needs a Description!')
    try {
      const res = await axios.post(`${API}/bulk`, { items: valid, fiscal_year: filterYear || currentYear })
      alert(`✅ ${res.data.message}`)
      setShowBulkModal(false)
      setBulkRows(Array(5).fill(null).map(() => ({ ...emptyBulkRow })))
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  // Paste columns: Article No | Description | Property No | Unit of Measure | Unit Value | Balance/Card | On Hand | Accountable Person | PPE Type | Fund Cluster
  const handlePasteParse = () => {
    const lines = pasteText.trim().split('\n').filter(l => l.trim())
    const unmatchedSet = new Set()
    const rows = lines.map(line => {
      const c = line.split('\t')
      const ppeType = c[8]?.trim() || ''
      const fund = c[9]?.trim() || ''
      if (ppeType && !PPE_TYPES.includes(ppeType)) unmatchedSet.add(`PPE Type: ${ppeType}`)
      if (fund && !FUND_CLUSTERS.includes(fund)) unmatchedSet.add(`Fund: ${fund}`)
      return {
        article_no: c[0]?.trim() || '',
        description: c[1]?.trim() || '',
        property_number: c[2]?.trim() || '',
        unit_of_measure: c[3]?.trim() || '',
        unit_value: Number(c[4]) || '',
        balance_per_card: Number(c[5]) || '',
        on_hand_per_count: Number(c[6]) || '',
        accountable_person: c[7]?.trim() || '',
        ppe_type: PPE_TYPES.includes(ppeType) ? ppeType : '',
        fund_cluster: FUND_CLUSTERS.includes(fund) ? fund : '',
      }
    }).filter(r => r.description)
    setPastePreview(rows)
    setPasteUnmatched([...unmatchedSet])
  }

  const handlePasteImport = async () => {
    if (!pastePreview.length) return alert('Nothing to import!')
    try {
      const res = await axios.post(`${API}/bulk`, { items: pastePreview, fiscal_year: filterYear || currentYear })
      alert(`✅ ${res.data.message}`)
      setShowPasteModal(false); setPasteText(''); setPastePreview([]); setPasteUnmatched([])
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📦 RPCPPE</h2>
          <p className="text-gray-500 text-sm">Report on Physical Count of Property, Plant and Equipment</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPasteModal(true)} className="border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-50">📋 Paste Import</button>
          <button onClick={() => setShowBulkModal(true)} className="border border-purple-600 text-purple-600 px-3 py-2 rounded-lg text-sm hover:bg-purple-50">📝 Bulk Add</button>
          <button onClick={openAdd} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800">+ Add Record</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Total Records</p>
          <p className="text-3xl font-bold mt-1">{items.length}</p>
        </div>
        <div className="bg-blue-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Total Unit Value</p>
          <p className="text-2xl font-bold mt-1">₱{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-red-500 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Shortage Items</p>
          <p className="text-3xl font-bold mt-1">{shortageCount}</p>
        </div>
        <div className="bg-purple-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Overage Items</p>
          <p className="text-3xl font-bold mt-1">{overageCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search description, property no, person..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {PPE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterFund} onChange={e => setFilterFund(e.target.value)}>
          <option value="">All Fund Clusters</option>
          {FUND_CLUSTERS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 flex-wrap text-sm text-gray-500">
        <span className="bg-white px-3 py-1 rounded-lg shadow-sm border">
          Total: <strong>{sortedItems.length}</strong> records{filterYear ? ` for ${filterYear}` : ''}
        </span>
        {sortField && (
          <span className="bg-white px-3 py-1 rounded-lg shadow-sm border text-green-700">
            Sorted by: <strong>{sortField}</strong> {sortDir === 'asc' ? '▲' : '▼'}
            <button onClick={() => setSortField('')} className="ml-1 text-red-400 hover:text-red-600">✕</button>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-700 text-white">
              <SortHeader label="Article No." field="article_no" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Description" field="description" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Property No." field="property_number" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Unit Value" field="unit_value" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Balance/Card" field="balance_per_card" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
              <SortHeader label="On Hand" field="on_hand_per_count" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
              <SortHeader label="Shortage/Overage" field="shortage_overage" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
              <SortHeader label="Accountable Person" field="accountable_person" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="PPE Type" field="ppe_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Fund" field="fund_cluster" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Year" field="fiscal_year" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-8 text-gray-400">No records found</td></tr>
            ) : paged.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-500">{item.article_no || '—'}</td>
                <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={item.description}>{item.description}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{item.property_number || '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700 font-medium">
                  {item.unit_value ? `₱${Number(item.unit_value).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{item.balance_per_card ?? '—'}</td>
                <td className="px-4 py-3 text-center text-gray-600">{item.on_hand_per_count ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <ShortagePill value={deriveShortage(item.on_hand_per_count, item.balance_per_card)} />
                </td>
                <td className="px-4 py-3 text-gray-700">{item.accountable_person || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{item.ppe_type || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{item.fund_cluster || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    {item.fiscal_year}
                  </span>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} — {sortedItems.length} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + Math.max(1, page - 2))
              .filter(n => n <= totalPages).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-3 py-1 text-sm rounded-lg border ${page === n ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 hover:bg-gray-50'}`}>{n}</button>
              ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editId ? 'Edit Record' : 'Add New Record'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fiscal Year</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.fiscal_year} onChange={e => setForm({ ...form, fiscal_year: e.target.value })}>
                  {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {[
                { label: 'Article No.', key: 'article_no', type: 'number' },
                { label: 'Property Number', key: 'property_number' },
                { label: 'Unit of Measure', key: 'unit_of_measure' },
                { label: 'Unit Value', key: 'unit_value', type: 'number' },
                { label: 'Balance per Card', key: 'balance_per_card', type: 'number' },
                { label: 'On Hand per Count', key: 'on_hand_per_count', type: 'number' },
                { label: 'Accountable Person', key: 'accountable_person' },
                { label: 'Date Acquired', key: 'date_acquired', type: 'date' },
                { label: 'Location', key: 'location' },
                { label: 'Report Date', key: 'report_date', type: 'date' },
              ].map(({ label, key, type = 'text' }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input type={type}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Shortage / Overage <span className="text-green-600">(auto)</span></label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 flex items-center justify-between">
                  <ShortagePill value={deriveShortage(form.on_hand_per_count, form.balance_per_card)} />
                  <span className="text-xs text-gray-400">On Hand − Balance</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">PPE Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.ppe_type} onChange={e => setForm({ ...form, ppe_type: e.target.value })}>
                  <option value="">Select type</option>
                  {PPE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fund Cluster</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.fund_cluster} onChange={e => setForm({ ...form, fund_cluster: e.target.value })}>
                  <option value="">Select fund</option>
                  {FUND_CLUSTERS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Description *</label>
                <textarea rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Remarks</label>
                <textarea rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">
                {editId ? 'Save Changes' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ADD MODAL */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Bulk Add Records</h3>
            <p className="text-sm text-gray-500 mb-4">Fill multiple rows at once. Shortage/Overage is calculated automatically.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">#</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Article No.</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Description *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Property No.</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Unit Value</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Balance/Card</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">On Hand</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Shortage</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Accountable Person</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">PPE Type</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Fund</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1 border border-gray-200 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-16 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.article_no} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], article_no: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-40 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500 rounded px-1 py-1"
                          placeholder="Description" value={row.description}
                          onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], description: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-24 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.property_number} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], property_number: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-20 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.unit_value} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], unit_value: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-16 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.balance_per_card} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], balance_per_card: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-16 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.on_hand_per_count} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], on_hand_per_count: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200 text-center">
                        <ShortagePill value={deriveShortage(row.on_hand_per_count, row.balance_per_card)} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-28 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.accountable_person} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], accountable_person: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <select className="w-32 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.ppe_type} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], ppe_type: e.target.value }; setBulkRows(r) }}>
                          <option value="">Select</option>
                          {PPE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <select className="w-32 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.fund_cluster} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], fund_cluster: e.target.value }; setBulkRows(r) }}>
                          <option value="">Select</option>
                          {FUND_CLUSTERS.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setBulkRows([...bulkRows, { ...emptyBulkRow }])}
              className="mt-3 text-sm text-green-700 hover:underline">+ Add more rows</button>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulkSave} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">Save All</button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE IMPORT MODAL */}
      {showPasteModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Paste from Excel</h3>
            <p className="text-sm text-gray-500 mb-1">
              Columns (in order): <strong>Article No. | Description | Property No. | Unit of Measure | Unit Value | Balance/Card | On Hand | Accountable Person | PPE Type | Fund Cluster</strong>
            </p>
            <p className="text-xs text-gray-400 mb-3">Copy rows directly from Excel (no header row) and paste below. Shortage/Overage is calculated automatically.</p>
            <textarea rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Paste Excel data here..." value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <button onClick={handlePasteParse} className="mt-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Parse Data</button>

            {pasteUnmatched.length > 0 && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                ⚠️ Unrecognized values ignored (left blank, edit after import): {pasteUnmatched.join(', ')}
              </div>
            )}

            {pastePreview.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview — {pastePreview.length} rows:</p>
                <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Property No.</th>
                      <th className="px-3 py-2 text-right">Unit Value</th>
                      <th className="px-3 py-2 text-center">Shortage</th>
                    </tr></thead>
                    <tbody>
                      {pastePreview.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-1.5">{r.description}</td>
                          <td className="px-3 py-1.5">{r.property_number || '—'}</td>
                          <td className="px-3 py-1.5 text-right">{r.unit_value ? `₱${Number(r.unit_value).toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-1.5 text-center"><ShortagePill value={deriveShortage(r.on_hand_per_count, r.balance_per_card)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handlePasteImport} className="mt-3 px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">Import {pastePreview.length} rows</button>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => { setShowPasteModal(false); setPasteText(''); setPastePreview([]); setPasteUnmatched([]) }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
