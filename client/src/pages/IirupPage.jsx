import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { getYearOptions } from '../utils/years'

const API = `${import.meta.env.VITE_API_URL}/api/iirup`
const CATEGORIES = [
  'Office Equipment',
  'Agricultural & Forestry Equipment',
  'PPE / Semi-expendable',
  'Other Equipment'
]
const currentYear = new Date().getFullYear()
const emptyForm = {
  property_no: '', particulars: '', category: '', date_acquired: '',
  quantity: 1, unit_cost: '', total_cost: '', accumulated_depreciation: '',
  carrying_amount: '', disposal_type: '', disposal_status: 'pending',
  remarks: '', report_date: '', fiscal_year: currentYear
}

const HEADER_ALIASES = {
  property_no: ['property no', 'property no.', 'property number'],
  particulars: ['particulars', 'particulars / articles', 'particulars/articles', 'description', 'articles'],
  category: ['category', 'classification'],
  date_acquired: ['date acquired', 'date', 'acquired'],
  quantity: ['quantity', 'qty'],
  unit_cost: ['unit cost', 'unit value'],
  total_cost: ['total cost', 'total value', 'amount'],
  accumulated_depreciation: ['accumulated depreciation', 'depreciation'],
  carrying_amount: ['carrying amount', 'carrying value', 'net value'],
  disposal_type: ['disposal type', 'disposal'],
  remarks: ['remarks', 'remark', 'notes'],
  report_date: ['report date', 'as of', 'as of date'],
}

function matchHeaderToField(headerText) {
  const normalized = headerText.toLowerCase().trim().replace(/\s+/g, ' ')
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return field
  }
  return null
}

function cleanNumber(val) {
  if (val === undefined || val === null) return ''
  const cleaned = String(val).replace(/[^0-9.\-]/g, '')
  return cleaned === '' ? '' : cleaned
}

function SortHeader({ label, field, sortField, sortDir, onSort, align = 'left' }) {
  const isActive = sortField === field
  return (
    <th className={`px-4 py-3 text-${align} cursor-pointer select-none hover:bg-green-600 transition-colors`}
      onClick={() => onSort(field)}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {label}
        <span className="text-xs opacity-70">
          {isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
        </span>
      </div>
    </th>
  )
}

const CATEGORY_BADGE = {
  'Office Equipment': 'bg-blue-100 text-blue-700',
  'Agricultural & Forestry Equipment': 'bg-emerald-100 text-emerald-700',
  'PPE / Semi-expendable': 'bg-purple-100 text-purple-700',
  'Other Equipment': 'bg-gray-100 text-gray-700',
}

export default function IirupPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterYear, setFilterYear] = useState(currentYear)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [bulkRows, setBulkRows] = useState(Array(5).fill(null).map(() => ({ ...emptyForm, category: CATEGORIES[0] })))
  const [pasteText, setPasteText] = useState('')
  const [pastePreview, setPastePreview] = useState([])
  const [pasteUnmatched, setPasteUnmatched] = useState([])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterCategory) params.category = filterCategory
      if (filterYear) params.fiscal_year = filterYear
      const res = await axios.get(API, { params })
      setItems(res.data)
    } catch (err) {
      console.error('fetchItems error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchItems(); setPage(1) }, [search, filterCategory, filterYear])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedItems = useMemo(() => {
    if (!sortField) return items
    return [...items].sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortField, sortDir])

  const totalPages = Math.ceil(sortedItems.length / PER_PAGE)
  const paged = sortedItems.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openAdd = () => { setForm({ ...emptyForm, fiscal_year: filterYear || currentYear }); setEditId(null); setShowModal(true) }
  const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.particulars || !form.category) return alert('Particulars and Category are required!')
    try {
      if (editId) await axios.put(`${API}/${editId}`, form)
      else await axios.post(API, form)
      setShowModal(false)
      fetchItems()
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving record: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await axios.delete(`${API}/${id}`)
      fetchItems()
    } catch (err) {
      alert('Error deleting: ' + (err.response?.data?.error || err.message))
    }
  }

  // ─── BULK ADD ────────────────────────────────────────

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.particulars && r.particulars.trim() && r.category)
    if (!valid.length) return alert('Fill at least one row with Particulars and Category!')
    let success = 0
    let failed = 0
    for (const row of valid) {
      try {
        await axios.post(API, { ...row, fiscal_year: filterYear || currentYear })
        success++
      } catch (err) {
        failed++
        console.error('Bulk row failed:', row, err)
      }
    }
    alert(`✅ ${success} records added${failed > 0 ? `, ${failed} failed (check console)` : ''}`)
    setShowBulkModal(false)
    setBulkRows(Array(5).fill(null).map(() => ({ ...emptyForm, category: CATEGORIES[0] })))
    fetchItems()
  }

  // ─── PASTE IMPORT ────────────────────────────────────

  const handlePasteParse = () => {
    const lines = pasteText.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim() !== '')
    if (lines.length < 2) {
      alert('Paste at least a header row and one data row.')
      return
    }

    const headerCells = lines[0].split('\t')
    const fieldMap = {}
    const unmatchedHeaders = []

    headerCells.forEach((cell, idx) => {
      if (!cell.trim()) return
      const field = matchHeaderToField(cell)
      if (field) fieldMap[idx] = field
      else unmatchedHeaders.push(cell.trim())
    })

    setPasteUnmatched(unmatchedHeaders)

    if (Object.keys(fieldMap).length === 0) {
      alert('No matching columns found. Make sure you copied the header row along with your data.')
      setPastePreview([])
      return
    }

    const dataRows = lines.slice(1).filter(l => l.trim() !== '')
    const parsed = dataRows.map(line => {
      const cells = line.split('\t')
      const row = { ...emptyForm, category: CATEGORIES[0] }
      Object.entries(fieldMap).forEach(([idx, field]) => {
        let val = cells[Number(idx)] !== undefined ? cells[Number(idx)].trim() : ''
        if (['quantity', 'unit_cost', 'total_cost', 'accumulated_depreciation', 'carrying_amount'].includes(field)) {
          val = cleanNumber(val)
        }
        row[field] = val
      })
      return row
    }).filter(r => r.particulars && r.particulars.trim())

    setPastePreview(parsed)
  }

  const handlePasteImport = async () => {
    if (!pastePreview.length) return alert('Nothing to import!')
    let success = 0
    let failed = 0
    for (const row of pastePreview) {
      try {
        await axios.post(API, { ...row, fiscal_year: filterYear || currentYear })
        success++
      } catch (err) {
        failed++
        console.error('Paste row failed:', row, err)
      }
    }
    alert(`✅ ${success} records imported${failed > 0 ? `, ${failed} failed (check console)` : ''}`)
    setShowPasteModal(false)
    setPasteText('')
    setPastePreview([])
    setPasteUnmatched([])
    fetchItems()
  }

  // Stats
  const totalItems = items.length
  const pendingCount = items.filter(i => i.disposal_status === 'pending').length
  const disposedCount = items.filter(i => i.disposal_status === 'disposed').length
  const totalCarrying = items.reduce((sum, i) => sum + (Number(i.carrying_amount) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-700 flex items-center justify-center text-white text-xl shadow">📋</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">IIRUP / IIRUSP</h2>
            <p className="text-gray-500 text-sm">Inventory and Inspection Report of Unserviceable Property</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPasteModal(true)} className="border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-50">📋 Paste Import</button>
          <button onClick={() => setShowBulkModal(true)} className="border border-purple-600 text-purple-600 px-3 py-2 rounded-lg text-sm hover:bg-purple-50">📝 Bulk Add</button>
          <button onClick={openAdd} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 shadow">
            + Add Record
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Total Records</p>
          <p className="text-3xl font-bold mt-1">{totalItems}</p>
        </div>
        <div className="bg-yellow-500 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Pending Disposal</p>
          <p className="text-3xl font-bold mt-1">{pendingCount}</p>
        </div>
        <div className="bg-red-500 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Disposed</p>
          <p className="text-3xl font-bold mt-1">{disposedCount}</p>
        </div>
        <div className="bg-blue-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs opacity-80">Total Carrying Value</p>
          <p className="text-2xl font-bold mt-1">₱{totalCarrying.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search by name or property no..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap text-sm text-gray-500">
        <span className="bg-white px-3 py-1 rounded-lg shadow-sm border">
          Total: <strong>{sortedItems.length}</strong> records
          {filterYear ? ` for ${filterYear}` : ''}
        </span>
        {sortField && (
          <span className="bg-white px-3 py-1 rounded-lg shadow-sm border text-green-700">
            Sorted by: <strong>{sortField}</strong> {sortDir === 'asc' ? '▲' : '▼'}
            <button onClick={() => setSortField('')} className="ml-1 text-red-400 hover:text-red-600">✕</button>
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-700 text-white">
              <SortHeader label="Property No." field="property_no" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Particulars / Articles" field="particulars" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Date Acquired" field="date_acquired" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Unit Cost" field="unit_cost" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Total Cost" field="total_cost" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Carrying Amount" field="carrying_amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Year" field="fiscal_year" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
              <SortHeader label="Disposal Status" field="disposal_status" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">No records found</td></tr>
            ) : paged.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-600">{item.property_no || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{item.particulars}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_BADGE[item.category] || 'bg-gray-100 text-gray-700'}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.date_acquired || '—'}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {item.unit_cost ? `₱${Number(item.unit_cost).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {item.total_cost ? `₱${Number(item.total_cost).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {item.carrying_amount ? `₱${Number(item.carrying_amount).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    {item.fiscal_year}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.disposal_status === 'disposed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{item.disposal_status}</span>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
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
                { label: 'Property No.', key: 'property_no' },
                { label: 'Date Acquired', key: 'date_acquired', type: 'date' },
                { label: 'Quantity', key: 'quantity', type: 'number' },
                { label: 'Unit Cost', key: 'unit_cost', type: 'number' },
                { label: 'Total Cost', key: 'total_cost', type: 'number' },
                { label: 'Accumulated Depreciation', key: 'accumulated_depreciation', type: 'number' },
                { label: 'Carrying Amount', key: 'carrying_amount', type: 'number' },
                { label: 'Report Date', key: 'report_date', type: 'date' },
              ].map(({ label, key, type = 'text' }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input type={type}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Particulars / Articles *</label>
                <textarea rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.particulars} onChange={e => setForm({ ...form, particulars: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Disposal Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.disposal_type} onChange={e => setForm({ ...form, disposal_type: e.target.value })}
                >
                  <option value="">None</option>
                  <option>Sale</option>
                  <option>Transfer</option>
                  <option>Destruction</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Disposal Status</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.disposal_status} onChange={e => setForm({ ...form, disposal_status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Remarks</label>
                <textarea rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}
                />
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
            <h3 className="text-lg font-bold text-gray-800 mb-1">Bulk Add IIRUP Records</h3>
            <p className="text-sm text-gray-500 mb-4">Fill multiple rows at once. Particulars and Category are required per row.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">#</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Particulars *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Category *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Property No.</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Qty</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Unit Cost</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1 border border-gray-200 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-48 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500 rounded px-1 py-1"
                          value={row.particulars} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], particulars: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <select className="w-40 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.category} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], category: e.target.value }; setBulkRows(r) }}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-32 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.property_no} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], property_no: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-16 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.quantity} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], quantity: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-20 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.unit_cost} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], unit_cost: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-20 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.total_cost} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], total_cost: e.target.value }; setBulkRows(r) }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setBulkRows([...bulkRows, { ...emptyForm, category: CATEGORIES[0] }])}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Paste from Excel</h3>
            <p className="text-sm text-gray-500 mb-1">
              Copy your Excel rows <strong>including the header row</strong>, then paste below. Columns are matched by name automatically.
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Recognized headers: Property No., Particulars/Articles, Category, Date Acquired, Quantity, Unit Cost, Total Cost, Accumulated Depreciation, Carrying Amount, Remarks, Report Date
            </p>
            <textarea rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Paste Excel data here (with header row)..." value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <button onClick={handlePasteParse} className="mt-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Parse Data</button>

            {pasteUnmatched.length > 0 && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                ⚠️ Unrecognized columns ignored: {pasteUnmatched.join(', ')}
              </div>
            )}

            {pastePreview.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview — {pastePreview.length} rows found:</p>
                <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">Particulars</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Property No.</th>
                      <th className="px-3 py-2 text-right">Unit Cost</th>
                      <th className="px-3 py-2 text-right">Total Cost</th>
                    </tr></thead>
                    <tbody>
                      {pastePreview.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-1.5 max-w-xs truncate">{r.particulars}</td>
                          <td className="px-3 py-1.5">{r.category}</td>
                          <td className="px-3 py-1.5">{r.property_no}</td>
                          <td className="px-3 py-1.5 text-right">{r.unit_cost}</td>
                          <td className="px-3 py-1.5 text-right">{r.total_cost}</td>
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
