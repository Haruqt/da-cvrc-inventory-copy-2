import { useEffect, useState } from 'react'
import axios from 'axios'
import { getYearOptions } from '../utils/years'

const API = `${import.meta.env.VITE_API_URL}/api/contracts`
const currentYear = new Date().getFullYear()
const emptyForm = {
  item_no: '', dealer_supplier: '', contract_no: '', amount: '',
  contract_period: '', status: 'unpaid', fiscal_year: currentYear
}

export default function ContractsPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState(currentYear)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (filterStatus) params.status = filterStatus
    if (filterYear) params.fiscal_year = filterYear
    const res = await axios.get(API, { params })
    setItems(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, filterStatus, filterYear])

  const openAdd = () => { setForm({ ...emptyForm, fiscal_year: filterYear }); setEditId(null); setShowModal(true) }
  const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.dealer_supplier) return alert('Dealer/Supplier is required!')
    if (editId) await axios.put(`${API}/${editId}`, form)
    else await axios.post(API, form)
    setShowModal(false)
    fetchItems()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    await axios.delete(`${API}/${id}`)
    fetchItems()
  }

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contracts</h2>
          <p className="text-gray-500 text-sm">Job Orders and Contract listings</p>
        </div>
        <button onClick={openAdd} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800">
          + Add Record
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search supplier or contract no..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>unpaid</option>
          <option>paid</option>
          <option>ongoing</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex gap-3">
        <span className="bg-white px-3 py-1 rounded-lg shadow-sm border text-sm text-gray-500">
          Total: <strong>{items.length}</strong> records{filterYear ? ` for ${filterYear}` : ''}
        </span>
        <span className="bg-white px-3 py-1 rounded-lg shadow-sm border text-sm text-gray-500">
          Total Amount: <strong className="text-green-700">₱{totalAmount.toLocaleString()}</strong>
        </span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="px-4 py-3 text-left">Item No.</th>
              <th className="px-4 py-3 text-left">Dealer / Supplier</th>
              <th className="px-4 py-3 text-left">Contract No.</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-center">Year</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No records found</td></tr>
            ) : items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-500">{item.item_no || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{item.dealer_supplier}</td>
                <td className="px-4 py-3 text-gray-600">{item.contract_no || '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {item.amount ? `₱${Number(item.amount).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.contract_period || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    {item.fiscal_year}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'paid' ? 'bg-green-100 text-green-700'
                    : item.status === 'ongoing' ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                  }`}>{item.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
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
                { label: 'Item No.', key: 'item_no', type: 'number' },
                { label: 'Contract No.', key: 'contract_no' },
                { label: 'Amount', key: 'amount', type: 'number' },
                { label: 'Contract Period', key: 'contract_period' },
              ].map(({ label, key, type = 'text' }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input type={type}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Dealer / Supplier *</label>
                <input type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.dealer_supplier} onChange={e => setForm({ ...form, dealer_supplier: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="ongoing">Ongoing</option>
                </select>
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
    </div>
  )
}