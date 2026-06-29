import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { getYearOptions } from '../utils/years'

const API = `${import.meta.env.VITE_API_URL}/api/supplies`
const currentYear = new Date().getFullYear()

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

const UNITS = ['pc', 'pcs', 'ream', 'box', 'btl', 'bag', 'sack', 'set', 'pack', 'pad', 'jar', 'gal', 'l', 'kg', 'roll', 'can', 'tube', 'pair']

const DIVISIONS = ['CORN', 'RICE', 'LEGUMES', 'VEGETABLES', 'FRUITS', 'AFD', 'GSO', 'SUPPLY', 'ADMIN', 'FINANCE', 'PLANNING', 'OTHER']
const OFFICES = ['DA-CVRC', 'RFO', 'Provincial Office', 'Field Office', 'Other']

const LOCATIONS = [
  'Basco, Batanes', 'Itbayat, Batanes', 'Ivana, Batanes', 'Mahatao, Batanes', 'Sabtang, Batanes', 'Uyugan, Batanes',
  'Tuguegarao City, Cagayan', 'Abulug, Cagayan', 'Alcala, Cagayan', 'Allacapan, Cagayan', 'Amulung, Cagayan',
  'Aparri, Cagayan', 'Baggao, Cagayan', 'Ballesteros, Cagayan', 'Buguey, Cagayan', 'Calayan, Cagayan',
  'Camalaniugan, Cagayan', 'Claveria, Cagayan', 'Enrile, Cagayan', 'Gattaran, Cagayan', 'Gonzaga, Cagayan',
  'Iguig, Cagayan', 'Lal-lo, Cagayan', 'Lasam, Cagayan', 'Pamplona, Cagayan', 'Peñablanca, Cagayan',
  'Piat, Cagayan', 'Rizal, Cagayan', 'Sanchez-Mira, Cagayan', 'Santa Ana, Cagayan', 'Santa Praxedes, Cagayan',
  'Santa Teresita, Cagayan', 'Santo Niño, Cagayan', 'Solana, Cagayan', 'Tuao, Cagayan',
  'Ilagan City, Isabela', 'Cauayan City, Isabela', 'Santiago City, Isabela',
  'Alicia, Isabela', 'Angadanan, Isabela', 'Aurora, Isabela', 'Benito Soliven, Isabela', 'Burgos, Isabela',
  'Cabagan, Isabela', 'Cabatuan, Isabela', 'Cordon, Isabela', 'Dinapigue, Isabela', 'Echague, Isabela',
  'Gamu, Isabela', 'Jones, Isabela', 'Luna, Isabela', 'Maconacon, Isabela', 'Mallig, Isabela',
  'Naguilian, Isabela', 'Palanan, Isabela', 'Quezon, Isabela', 'Quirino, Isabela', 'Ramon, Isabela',
  'Reina Mercedes, Isabela', 'Roxas, Isabela', 'San Agustin, Isabela', 'San Guillermo, Isabela',
  'San Isidro, Isabela', 'San Manuel, Isabela', 'San Mariano, Isabela', 'San Mateo, Isabela',
  'San Pablo, Isabela', 'Santa Maria, Isabela', 'Santo Tomas, Isabela', 'Tumauini, Isabela', 'Delfin Albano, Isabela',
  'Bayombong, Nueva Vizcaya', 'Solano, Nueva Vizcaya', 'Bagabag, Nueva Vizcaya', 'Bambang, Nueva Vizcaya',
  'Diadi, Nueva Vizcaya', 'Dupax del Norte, Nueva Vizcaya', 'Dupax del Sur, Nueva Vizcaya',
  'Kasibu, Nueva Vizcaya', 'Kayapa, Nueva Vizcaya', 'Quezon, Nueva Vizcaya', 'Santa Fe, Nueva Vizcaya',
  'Aritao, Nueva Vizcaya', 'Alfonso Castañeda, Nueva Vizcaya', 'Ambaguio, Nueva Vizcaya', 'Villaverde, Nueva Vizcaya',
  'Cabarroguis, Quirino', 'Diffun, Quirino', 'Maddela, Quirino', 'Nagtipunan, Quirino',
  'Saguday, Quirino', 'Aglipay, Quirino',
]

const SECTION_CONFIG = {
  supplies: {
    title: 'Supplies',
    icon: '🗂️',
    sections: ['Office Supplies', 'Printer Supplies', 'Batteries & Electronics'],
    defaultItems: [
      { item_name: 'A4 Bond Paper', category: 'Office Supplies', unit: 'ream' },
      { item_name: 'Long Bond Paper', category: 'Office Supplies', unit: 'ream' },
      { item_name: 'Bond Paper Long S16', category: 'Office Supplies', unit: 'ream' },
      { item_name: 'Bond Paper Long S20', category: 'Office Supplies', unit: 'ream' },
      { item_name: 'Ballpen Black', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Ballpen Blue', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Signing Pen Black', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Signing Pen Blue', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Pencil', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Pentel Pen', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Marker Fine', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Marker Broad', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Whiteboard Marker', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Correction Tape', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Eraser', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Ruler', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Cutter', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Scissor', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Staple Wire', category: 'Office Supplies', unit: 'box' },
      { item_name: 'Paper Clip Big', category: 'Office Supplies', unit: 'box' },
      { item_name: 'Paper Clip Small', category: 'Office Supplies', unit: 'box' },
      { item_name: 'Paper Fastener', category: 'Office Supplies', unit: 'box' },
      { item_name: 'Rubber Band', category: 'Office Supplies', unit: 'box' },
      { item_name: 'Expanding Folder Green', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Expanding Folder Blue', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Long Folder White', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Folder White Short', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Certificate Holder', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Brown Envelope Long', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Expanding Envelope', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Carbon Paper', category: 'Office Supplies', unit: 'pack' },
      { item_name: 'Sticker Paper', category: 'Office Supplies', unit: 'pack' },
      { item_name: 'Sticky Notes', category: 'Office Supplies', unit: 'pad' },
      { item_name: 'Record Book 500 pgs', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Record Book 300 pgs', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Masking Tape', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Packing Tape', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Scotch Tape', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Stamp Pad', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Stamp Pad Ink', category: 'Office Supplies', unit: 'btl' },
      { item_name: 'Clip Board', category: 'Office Supplies', unit: 'pc' },
      { item_name: 'Glue', category: 'Office Supplies', unit: 'btl' },
      { item_name: 'Photo Paper', category: 'Office Supplies', unit: 'ream' },
      { item_name: 'Epson Ink 003 Black', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 003 Cyan', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 003 Magenta', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 003 Yellow', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 008 Black', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 008 Cyan', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 008 Magenta', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson Ink 008 Yellow', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Epson 664 Ink', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'BTD 100m Ink Black', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'BTD 100m Ink Cyan', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'BTD 100m Ink Magenta', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'BTD 100m Ink Yellow', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'Pilot Ink Refill', category: 'Printer Supplies', unit: 'btl' },
      { item_name: 'AA Battery', category: 'Batteries & Electronics', unit: 'pc' },
      { item_name: 'AAA Battery', category: 'Batteries & Electronics', unit: 'pc' },
    ]
  },
  agricultural: {
    title: 'Agricultural',
    icon: '🌱',
    sections: ['Fertilizers', 'Chemicals / Pesticides', 'Seeds'],
    defaultItems: [
      { item_name: 'Organic Fertilizer', category: 'Fertilizers', unit: 'bag' },
      { item_name: 'Urea Prilled (46-0-0)', category: 'Fertilizers', unit: 'bag' },
      { item_name: 'Urea Granular', category: 'Fertilizers', unit: 'bag' },
      { item_name: 'Complete Fertilizer (16-20-0)', category: 'Fertilizers', unit: 'bag' },
      { item_name: 'Muriate of Potash (0-0-60)', category: 'Fertilizers', unit: 'bag' },
      { item_name: 'Foliar Fertilizer', category: 'Fertilizers', unit: 'btl' },
      { item_name: 'VIRTAKO', category: 'Chemicals / Pesticides', unit: 'box' },
      { item_name: 'LAMBDA', category: 'Chemicals / Pesticides', unit: 'btl' },
      { item_name: 'GLYPHOSATE', category: 'Chemicals / Pesticides', unit: 'gal' },
      { item_name: 'ARMURE', category: 'Chemicals / Pesticides', unit: 'btl' },
      { item_name: 'Onecide', category: 'Chemicals / Pesticides', unit: 'btl' },
      { item_name: 'Carrageenan', category: 'Chemicals / Pesticides', unit: 'btl' },
      { item_name: 'Mungbean Seeds', category: 'Seeds', unit: 'kg' },
      { item_name: 'Soybean Seeds', category: 'Seeds', unit: 'kg' },
      { item_name: 'Corn IES #7', category: 'Seeds', unit: 'bag' },
    ]
  }
}

const PER_PAGE = 15

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const isActive = sortField === field
  return (
    <th className="px-4 py-3 text-left cursor-pointer select-none hover:bg-green-600 transition-colors"
      onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        <span className="text-xs opacity-70">
          {isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
        </span>
      </div>
    </th>
  )
}

// Custom searchable + typeable dropdown — replaces native <datalist> for consistent styling
function SmartDropdown({ options, value, onChange, placeholder }) {
  const [search, setSearch] = useState(value || '')
  const [open, setOpen] = useState(false)

  useEffect(() => { setSearch(value || '') }, [value])

  const filtered = options.filter(o => o.toLowerCase().includes((search || '').toLowerCase())).slice(0, 30)

  return (
    <div className="relative">
      <input type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder={placeholder || 'Select or type...'}
        value={search}
        onFocus={() => setOpen(true)}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value) }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.map(opt => (
            <div key={opt} className="px-3 py-2 text-sm text-gray-800 hover:bg-green-50 cursor-pointer"
              onClick={() => { onChange(opt); setSearch(opt); setOpen(false) }}>
              {opt}
            </div>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

// Searchable item dropdown with "add new" option
function ItemDropdown({ items, value, onChange, onAddNew, placeholder }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = items.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase())).slice(0, 20)

  return (
    <div className="relative">
      <input type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder={placeholder || 'Search or select item...'}
        value={search || value}
        onFocus={() => setOpen(true)}
        onChange={e => { setSearch(e.target.value); onChange('') }}
      />
      {open && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">No items found</div>
          )}
          {filtered.map(item => (
            <div key={item.id} className="px-3 py-2 text-sm text-gray-800 hover:bg-green-50 cursor-pointer"
              onClick={() => { onChange(item); setSearch(item.item_name); setOpen(false) }}>
              <span className="font-medium">{item.item_name}</span>
              <span className="text-xs text-gray-400 ml-2">{item.category} · {item.unit}</span>
            </div>
          ))}
          <div className="px-3 py-2 text-sm text-green-700 hover:bg-green-50 cursor-pointer border-t border-gray-100 font-medium"
            onClick={() => { setOpen(false); onAddNew(search) }}>
            + Add new item: "{search || 'new item'}"
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

export default function SuppliesPage({ pageType = 'supplies' }) {
  const config = SECTION_CONFIG[pageType]
  const isAgri = pageType === 'agricultural'
  const [tab, setTab] = useState('stock')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [items, setItems] = useState([])
  const [rsmi, setRsmi] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState(currentYear)
  const [filterMonth, setFilterMonth] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const [showItemModal, setShowItemModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showBulkIssueModal, setShowBulkIssueModal] = useState(false)
  const [showRsmiModal, setShowRsmiModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [editItemId, setEditItemId] = useState(null)
  const [editRsmiId, setEditRsmiId] = useState(null)

  const today = () => new Date().toISOString().split('T')[0]

  const defaultItem = { item_name: '', category: config.sections[0], section: config.sections[0], unit: 'pc', quantity_in: 0, unit_cost: 0, division: '', office: '', remarks: '', fiscal_year: currentYear }
  const defaultRsmi = { ris_no: '', supply_item_id: '', item_name: '', section: '', unit: '', quantity_issued: 1, unit_cost: 0, division: '', office: '', location: '', requested_by: '', resp_center_code: '', po_no: '', stock_no: '', date_issued: today(), fiscal_year: currentYear }

  const [itemForm, setItemForm] = useState(defaultItem)
  const [rsmiForm, setRsmiForm] = useState(defaultRsmi)
  const [bulkRows, setBulkRows] = useState(Array(5).fill(null).map(() => ({ item_name: '', category: config.sections[0], section: config.sections[0], unit: 'pc', quantity_in: 0, unit_cost: 0, division: '', office: '', remarks: '' })))
  const [bulkIssueRows, setBulkIssueRows] = useState(Array(5).fill(null).map(() => ({ supply_item_id: '', item_name: '', unit: '', section: '', quantity_issued: 1, unit_cost: 0, division: '', office: '', location: '', requested_by: '', ris_no: '', date_issued: today() })))
  const [pasteText, setPasteText] = useState('')
  const [pastePreview, setPastePreview] = useState([])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (categoryFilter !== 'All') params.category = categoryFilter
      if (filterYear) params.fiscal_year = filterYear
      const res = await axios.get(`${API}/items`, { params })
      setItems(res.data.filter(i => config.sections.includes(i.category)))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchRsmi = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterYear) params.fiscal_year = filterYear
      if (filterMonth) params.month = filterMonth
      if (categoryFilter !== 'All') params.section = categoryFilter
      const res = await axios.get(`${API}/rsmi`, { params })
      setRsmi(res.data.filter(r => config.sections.includes(r.section) || !r.section))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterYear) params.fiscal_year = filterYear
      if (categoryFilter !== 'All') params.section = categoryFilter
      const res = await axios.get(`${API}/history`, { params })
      setHistory(res.data.filter(h => config.sections.includes(h.section) || !h.section))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'stock') fetchItems()
    else if (tab === 'rsmi') fetchRsmi()
    else fetchHistory()
    setPage(1)
  }, [tab, search, categoryFilter, filterYear, filterMonth, pageType])

  // Also fetch items list in background for RSMI tab item dropdowns
  useEffect(() => {
    if (tab !== 'stock') fetchItems()
  }, [filterYear, pageType])

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

  const sortedRsmi = useMemo(() => {
    if (!sortField) return rsmi
    return [...rsmi].sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rsmi, sortField, sortDir])

  const generateRisNo = async (year) => {
    try {
      const res = await axios.get(`${API}/rsmi/next-ris/${year}`)
      return res.data.ris_no
    } catch (err) {
      return ''
    }
  }

  const openIssue = async (item) => {
    const year = filterYear || currentYear
    const risNo = await generateRisNo(year)
    setRsmiForm({
      ...defaultRsmi,
      ris_no: risNo,
      supply_item_id: item.id,
      item_name: item.item_name,
      section: item.category,
      unit: item.unit,
      date_issued: today(),
      fiscal_year: year
    })
    setShowIssueModal(true)
  }

  // Top-level Issue button: opens modal with item search, no pre-selected item
  const openIssueFromTop = async () => {
    const year = filterYear || currentYear
    const risNo = await generateRisNo(year)
    setRsmiForm({ ...defaultRsmi, ris_no: risNo, date_issued: today(), fiscal_year: year })
    setShowIssueModal(true)
  }

  const handleSaveItem = async () => {
    if (!itemForm.item_name || !itemForm.category || !itemForm.unit) return alert('Name, Category and Unit are required!')
    try {
      const payload = { ...itemForm, section: itemForm.category, fiscal_year: itemForm.fiscal_year || currentYear }
      if (editItemId) await axios.put(`${API}/items/${editItemId}`, payload)
      else await axios.post(`${API}/items`, payload)
      setShowItemModal(false)
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.item_name && r.category && r.unit)
    if (!valid.length) return alert('Fill at least one row!')
    try {
      const res = await axios.post(`${API}/items/bulk`, { items: valid.map(r => ({ ...r, section: r.category })), fiscal_year: filterYear || currentYear })
      alert(`✅ ${res.data.message}`)
      setShowBulkModal(false)
      setBulkRows(Array(5).fill(null).map(() => ({ item_name: '', category: config.sections[0], section: config.sections[0], unit: 'pc', quantity_in: 0, unit_cost: 0, division: '', office: '', remarks: '' })))
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleBulkIssueSave = async () => {
    const valid = bulkIssueRows.filter(r => r.item_name && r.quantity_issued)
    if (!valid.length) return alert('Fill at least one row!')

    const stockErrors = []
    for (const r of valid) {
      if (r.supply_item_id) {
        const found = items.find(i => i.id === Number(r.supply_item_id))
        if (found && Number(r.quantity_issued) > Number(found.balance)) {
          stockErrors.push(`${r.item_name}: Available ${found.balance}, Requested ${r.quantity_issued}`)
        }
      }
    }
    if (stockErrors.length > 0) {
      alert(`⚠️ Cannot issue — insufficient stock:\n\n${stockErrors.join('\n')}\n\nPlease fix quantities or restock first.`)
      return
    }

    try {
      const res = await axios.post(`${API}/rsmi/bulk`, { records: valid.map(r => ({ ...r, section: r.section || config.sections[0] })), fiscal_year: filterYear || currentYear })
      if (res.data.errors?.length > 0) alert(`⚠️ Some items skipped:\n${res.data.errors.join('\n')}`)
      else alert(`✅ ${res.data.count} records issued!`)
      setShowBulkIssueModal(false)
      setBulkIssueRows(Array(5).fill(null).map(() => ({ supply_item_id: '', item_name: '', unit: '', section: '', quantity_issued: 1, unit_cost: 0, division: '', office: '', location: '', requested_by: '', ris_no: '', date_issued: today() })))
      fetchItems()
      fetchRsmi()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleLoadDefaults = async () => {
    if (!confirm(`Load ${config.defaultItems.length} default items for ${filterYear || currentYear}? Duplicates will be skipped.`)) return
    try {
      const res = await axios.post(`${API}/items/bulk`, {
        items: config.defaultItems.map(i => ({ item_name: i.item_name, category: i.category, section: i.category, unit: i.unit, quantity_in: 0, unit_cost: 0, remarks: '' })),
        fiscal_year: filterYear || currentYear,
        skipDuplicates: true
      })
      alert(`✅ ${res.data.message}`)
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handlePasteParse = () => {
    const lines = pasteText.trim().split('\n').filter(l => l.trim())
    setPastePreview(lines.map(line => {
      const c = line.split('\t')
      return { item_name: c[0]?.trim() || '', category: c[1]?.trim() || config.sections[0], section: c[1]?.trim() || config.sections[0], unit: c[2]?.trim() || 'pc', quantity_in: Number(c[3]) || 0, unit_cost: Number(c[4]) || 0, remarks: c[5]?.trim() || '' }
    }).filter(r => r.item_name))
  }

  const handlePasteImport = async () => {
    if (!pastePreview.length) return alert('Nothing to import!')
    try {
      const res = await axios.post(`${API}/items/bulk`, { items: pastePreview, fiscal_year: filterYear || currentYear })
      alert(`✅ ${res.data.message}`)
      setShowPasteModal(false); setPasteText(''); setPastePreview([])
      fetchItems()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleIssue = async () => {
    if (!rsmiForm.item_name || !rsmiForm.quantity_issued) return alert('Item and Quantity are required!')
    const currentItem = items.find(i => i.id === Number(rsmiForm.supply_item_id))
    if (currentItem && Number(rsmiForm.quantity_issued) > Number(currentItem.balance)) {
      alert(`⚠️ Cannot issue! Available stock: ${currentItem.balance} ${currentItem.unit}\nRequested: ${rsmiForm.quantity_issued} ${currentItem.unit}\n\nPlease restock first using Edit.`)
      return
    }
    try {
      await axios.post(`${API}/rsmi`, { ...rsmiForm, section: rsmiForm.section || config.sections[0] })
      setShowIssueModal(false)
      fetchItems()
      if (tab === 'rsmi') fetchRsmi()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleSaveRsmi = async () => {
    if (!rsmiForm.item_name || !rsmiForm.quantity_issued) return alert('Item and Quantity are required!')
    try {
      if (editRsmiId) await axios.put(`${API}/rsmi/${editRsmiId}`, rsmiForm)
      else await axios.post(`${API}/rsmi`, rsmiForm)
      setShowRsmiModal(false)
      fetchRsmi()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    await axios.delete(`${API}/items/${id}`)
    fetchItems()
  }

  const handleDeleteRsmi = async (id) => {
    if (!confirm('Delete? Stock will be restored.')) return
    await axios.delete(`${API}/rsmi/${id}`)
    fetchRsmi(); fetchItems()
  }

  const totalRsmiAmount = rsmi.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const lowStock = items.filter(i => i.balance <= 5 && i.balance > 0).length
  const outOfStock = items.filter(i => i.balance <= 0).length

  const dataToPage = tab === 'stock' ? sortedItems : tab === 'rsmi' ? sortedRsmi : history
  const totalPages = Math.ceil(dataToPage.length / PER_PAGE)
  const paged = dataToPage.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{config.icon} {config.title}</h2>
          <p className="text-gray-500 text-sm">Stock Inventory · RSMI Records · History</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={openIssueFromTop} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">🚀 Issue Supply</button>
          {tab === 'stock' && (
            <>
              <button onClick={handleLoadDefaults} className="border border-green-700 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-50">Load Defaults</button>
              <button onClick={() => setShowPasteModal(true)} className="border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-50">📋 Paste Import</button>
              <button onClick={() => setShowBulkModal(true)} className="border border-purple-600 text-purple-600 px-3 py-2 rounded-lg text-sm hover:bg-purple-50">📝 Bulk Add</button>
              <button onClick={() => { setItemForm({ ...defaultItem, fiscal_year: filterYear || currentYear }); setEditItemId(null); setShowItemModal(true) }}
                className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800">+ Add Item</button>
            </>
          )}
          {tab === 'rsmi' && (
            <button onClick={() => setShowBulkIssueModal(true)} className="border border-orange-500 text-orange-500 px-3 py-2 rounded-lg text-sm hover:bg-orange-50">📦 Bulk Issue</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit">
        {['stock', 'rsmi', 'history'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSortField(''); setSortDir('asc') }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-green-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
            {t === 'stock' ? '📦 Stock' : t === 'rsmi' ? '📋 RSMI' : '🕓 History'}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...config.sections].map(s => (
          <button key={s} onClick={() => setCategoryFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${categoryFilter === s ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {tab === 'stock' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-600 text-white rounded-xl p-4 shadow">
            <p className="text-xs opacity-80">Total Items</p>
            <p className="text-3xl font-bold mt-1">{items.length}</p>
          </div>
          <div className="bg-yellow-500 text-white rounded-xl p-4 shadow">
            <p className="text-xs opacity-80">Low Stock (≤5)</p>
            <p className="text-3xl font-bold mt-1">{lowStock}</p>
          </div>
          <div className="bg-red-500 text-white rounded-xl p-4 shadow">
            <p className="text-xs opacity-80">Out of Stock</p>
            <p className="text-3xl font-bold mt-1">{outOfStock}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={search} onChange={e => setSearch(e.target.value)} />
        {tab === 'rsmi' && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap text-sm text-gray-500">
        <span className="bg-white px-3 py-1 rounded-lg shadow-sm border">Total: <strong>{dataToPage.length}</strong> records</span>
        {tab === 'rsmi' && <span className="bg-white px-3 py-1 rounded-lg shadow-sm border">Total Amount: <strong className="text-green-700">₱{totalRsmiAmount.toLocaleString()}</strong></span>}
        {sortField && <span className="bg-white px-3 py-1 rounded-lg shadow-sm border text-green-700">Sorted by: <strong>{sortField}</strong> {sortDir === 'asc' ? '▲' : '▼'} <button onClick={() => setSortField('')} className="ml-1 text-red-400 hover:text-red-600">✕</button></span>}
      </div>

      {/* STOCK TABLE */}
      {tab === 'stock' && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white">
                <SortHeader label="Item Name" field="item_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left">Unit</th>
                <SortHeader label="Qty In" field="quantity_in" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Qty Out" field="quantity_out" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Balance" field="balance" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Division" field="division" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Office" field="office" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Year" field="fiscal_year" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
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
                  <td className="px-4 py-3 font-medium text-gray-800">{item.item_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{item.category}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">{item.quantity_in}</td>
                  <td className="px-4 py-3 text-center text-red-500 font-medium">{item.quantity_out}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.balance <= 0 ? 'bg-red-100 text-red-700' : item.balance <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {item.balance}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.division || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.office || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{item.fiscal_year}</span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button onClick={() => openIssue(item)} className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs mr-1">Issue</button>
                    <button onClick={() => { setItemForm({ ...item }); setEditItemId(item.id); setShowItemModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RSMI TABLE */}
      {tab === 'rsmi' && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white">
                <SortHeader label="RIS No." field="ris_no" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Date" field="date_issued" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Item" field="item_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Category" field="section" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left">Unit</th>
                <SortHeader label="Qty" field="quantity_issued" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Division" field="division" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Office" field="office" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                {isAgri && <SortHeader label="Location" field="location" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                <SortHeader label="Requested By" field="requested_by" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left">P.O. No.</th>
                <SortHeader label="Year" field="fiscal_year" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-8 text-gray-400">No records found</td></tr>
              ) : paged.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.ris_no || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.date_issued || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.item_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.section || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{r.unit}</td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600">{r.quantity_issued}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.division || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.office || '—'}</td>
                  {isAgri && <td className="px-4 py-3 text-xs text-gray-500">{r.location || '—'}</td>}
                  <td className="px-4 py-3 text-gray-700">{r.requested_by || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.po_no || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{r.fiscal_year}</span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button onClick={() => { setRsmiForm({ ...r }); setEditRsmiId(r.id); setShowRsmiModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                    <button onClick={() => handleDeleteRsmi(r.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HISTORY TABLE */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Action</th>
                <th className="px-4 py-3 text-center">Qty Changed</th>
                <th className="px-4 py-3 text-center">Old Balance</th>
                <th className="px-4 py-3 text-center">New Balance</th>
                <th className="px-4 py-3 text-left">Performed By</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No history yet</td></tr>
              ) : paged.map((h, i) => (
                <tr key={h.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500 text-xs">{h.created_at ? new Date(h.created_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{h.item_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{h.section || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      h.action === 'ADDED' || h.action === 'BULK ADDED' || h.action === 'RESTOCKED' ? 'bg-green-100 text-green-700'
                      : h.action === 'ISSUED' ? 'bg-blue-100 text-blue-700'
                      : h.action === 'EDITED' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>{h.action}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{h.quantity_changed ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{h.old_balance ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-medium text-green-700">{h.new_balance ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{h.performed_by || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{h.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} — {dataToPage.length} total</p>
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

      {/* ADD/EDIT ITEM MODAL */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editItemId ? 'Edit Item' : 'Add Item'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Item Name *</label>
                {!editItemId ? (
                  <ItemDropdown items={items} value={itemForm.item_name} placeholder="Search or type new item..."
                    onChange={(item) => { if (item) setItemForm({ ...itemForm, item_name: item.item_name, unit: item.unit, category: item.category, section: item.category }) }}
                    onAddNew={(name) => setItemForm({ ...itemForm, item_name: name })} />
                ) : (
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={itemForm.item_name} onChange={e => setItemForm({ ...itemForm, item_name: e.target.value })} />
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value, section: e.target.value })}>
                  {config.sections.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Unit *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Quantity In</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemForm.quantity_in} onChange={e => setItemForm({ ...itemForm, quantity_in: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Unit Cost</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemForm.unit_cost} onChange={e => setItemForm({ ...itemForm, unit_cost: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Division</label>
                <SmartDropdown options={DIVISIONS} value={itemForm.division} placeholder="Select or type custom..."
                  onChange={(val) => setItemForm({ ...itemForm, division: val })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Office</label>
                <SmartDropdown options={OFFICES} value={itemForm.office} placeholder="Select or type custom..."
                  onChange={(val) => setItemForm({ ...itemForm, office: val })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fiscal Year</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemForm.fiscal_year} onChange={e => setItemForm({ ...itemForm, fiscal_year: e.target.value })}>
                  {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Remarks</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemForm.remarks} onChange={e => setItemForm({ ...itemForm, remarks: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowItemModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveItem} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">{editItemId ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ADD MODAL */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Bulk Add Items</h3>
            <p className="text-sm text-gray-500 mb-4">Fill multiple rows at once.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">#</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Item Name *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Category *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Unit *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Qty In</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Division</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Office</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1 border border-gray-200 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-40 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500 rounded px-1 py-1"
                          placeholder="Item name" value={row.item_name}
                          onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], item_name: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <select className="w-full text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.category} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], category: e.target.value, section: e.target.value }; setBulkRows(r) }}>
                          {config.sections.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <select className="w-full text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.unit} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], unit: e.target.value }; setBulkRows(r) }}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-16 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.quantity_in} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], quantity_in: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-24 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          placeholder="Division"
                          value={row.division} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], division: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-24 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          placeholder="Office"
                          value={row.office} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], office: e.target.value }; setBulkRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-full text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.remarks} onChange={e => { const r = [...bulkRows]; r[idx] = { ...r[idx], remarks: e.target.value }; setBulkRows(r) }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setBulkRows([...bulkRows, { item_name: '', category: config.sections[0], section: config.sections[0], unit: 'pc', quantity_in: 0, unit_cost: 0, division: '', office: '', remarks: '' }])}
              className="mt-3 text-sm text-green-700 hover:underline">+ Add more rows</button>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulkSave} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">Save All</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ISSUE MODAL */}
      {showBulkIssueModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Bulk Issue Supplies</h3>
            <p className="text-sm text-gray-500 mb-4">Issue multiple items at once. Stock will be deducted automatically.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">#</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Item Name *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Unit</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Qty *</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Division</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Office</th>
                    {isAgri && <th className="px-2 py-2 text-left border border-gray-200 text-xs">Location</th>}
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Requested By</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">RIS No.</th>
                    <th className="px-2 py-2 text-left border border-gray-200 text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkIssueRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1 border border-gray-200 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-36 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500 rounded px-1 py-1"
                          placeholder="Item name" value={row.item_name}
                          list={`bulk-issue-items-${idx}`}
                          onChange={e => {
                            const r = [...bulkIssueRows]
                            const found = items.find(i => i.item_name === e.target.value)
                            r[idx] = { ...r[idx], item_name: e.target.value, supply_item_id: found?.id || '', unit: found?.unit || r[idx].unit, section: found?.category || r[idx].section }
                            setBulkIssueRows(r)
                          }} />
                        <datalist id={`bulk-issue-items-${idx}`}>
                          {items.map(i => <option key={i.id} value={i.item_name} />)}
                        </datalist>
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-14 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.unit} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], unit: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="number" className="w-16 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.quantity_issued} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], quantity_issued: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-24 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          placeholder="Division"
                          value={row.division} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], division: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-24 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          placeholder="Office"
                          value={row.office} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], office: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                      {isAgri && (
                        <td className="px-2 py-1 border border-gray-200">
                          <input type="text" list={`location-issue-${idx}`} className="w-32 text-xs border-0 focus:outline-none rounded px-1 py-1"
                            placeholder="Municipality..."
                            value={row.location} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], location: e.target.value }; setBulkIssueRows(r) }} />
                          <datalist id={`location-issue-${idx}`}>{LOCATIONS.map(l => <option key={l} value={l} />)}</datalist>
                        </td>
                      )}
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-28 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.requested_by} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], requested_by: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="text" className="w-24 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.ris_no} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], ris_no: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input type="date" className="w-32 text-xs border-0 focus:outline-none rounded px-1 py-1"
                          value={row.date_issued} onChange={e => { const r = [...bulkIssueRows]; r[idx] = { ...r[idx], date_issued: e.target.value }; setBulkIssueRows(r) }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setBulkIssueRows([...bulkIssueRows, { supply_item_id: '', item_name: '', unit: '', section: '', quantity_issued: 1, unit_cost: 0, division: '', office: '', location: '', requested_by: '', ris_no: '', date_issued: today() }])}
              className="mt-3 text-sm text-green-700 hover:underline">+ Add more rows</button>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowBulkIssueModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulkIssueSave} className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600">Issue All</button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE IMPORT MODAL */}
      {showPasteModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Paste from Excel</h3>
            <p className="text-sm text-gray-500 mb-3">Columns: <strong>Item Name | Category | Unit | Qty In | Unit Cost | Remarks</strong></p>
            <textarea rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Paste Excel data here..." value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <button onClick={handlePasteParse} className="mt-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Parse Data</button>
            {pastePreview.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview — {pastePreview.length} rows:</p>
                <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">Item Name</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-right">Qty In</th>
                    </tr></thead>
                    <tbody>
                      {pastePreview.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-1.5">{r.item_name}</td>
                          <td className="px-3 py-1.5">{r.category}</td>
                          <td className="px-3 py-1.5">{r.unit}</td>
                          <td className="px-3 py-1.5 text-right">{r.quantity_in}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handlePasteImport} className="mt-3 px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">Import {pastePreview.length} rows</button>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => { setShowPasteModal(false); setPasteText(''); setPastePreview([]) }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Issue</h3>
            <p className="text-sm text-gray-500 mb-4">
              {rsmiForm.item_name ? <>Issuing: <strong>{rsmiForm.item_name}</strong></> : 'Search and select an item to issue'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Item Name *</label>
                <ItemDropdown items={items} value={rsmiForm.item_name} placeholder="Search item to issue..."
                  onChange={(item) => { if (item) setRsmiForm({ ...rsmiForm, supply_item_id: item.id, item_name: item.item_name, unit: item.unit, section: item.category, unit_cost: item.unit_cost || 0 }) }}
                  onAddNew={(name) => setRsmiForm({ ...rsmiForm, item_name: name })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">RIS No. <span className="text-green-600">(auto)</span></label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.ris_no} onChange={e => setRsmiForm({ ...rsmiForm, ris_no: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date Issued</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.date_issued} onChange={e => setRsmiForm({ ...rsmiForm, date_issued: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Quantity Issued *</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.quantity_issued} onChange={e => setRsmiForm({ ...rsmiForm, quantity_issued: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Unit Cost</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.unit_cost} onChange={e => setRsmiForm({ ...rsmiForm, unit_cost: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Resp. Center Code</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.resp_center_code} onChange={e => setRsmiForm({ ...rsmiForm, resp_center_code: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">P.O. No.</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.po_no} onChange={e => setRsmiForm({ ...rsmiForm, po_no: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Division</label>
                <SmartDropdown options={DIVISIONS} value={rsmiForm.division} placeholder="Select or type custom..."
                  onChange={(val) => setRsmiForm({ ...rsmiForm, division: val })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Office</label>
                <SmartDropdown options={OFFICES} value={rsmiForm.office} placeholder="Select or type custom..."
                  onChange={(val) => setRsmiForm({ ...rsmiForm, office: val })} />
              </div>
              {isAgri && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Location / Municipality</label>
                  <SmartDropdown options={LOCATIONS} value={rsmiForm.location || ''} placeholder="Type or select municipality..."
                    onChange={(val) => setRsmiForm({ ...rsmiForm, location: val })} />
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Requested By *</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.requested_by} onChange={e => setRsmiForm({ ...rsmiForm, requested_by: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleIssue} className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600">Confirm Issue</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT RSMI MODAL */}
      {showRsmiModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editRsmiId ? 'Edit RSMI Entry' : 'Add RSMI Entry'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">RIS No.</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.ris_no} onChange={e => setRsmiForm({ ...rsmiForm, ris_no: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date Issued</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.date_issued} onChange={e => setRsmiForm({ ...rsmiForm, date_issued: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Item Name *</label>
                <ItemDropdown items={items} value={rsmiForm.item_name} placeholder="Search item..."
                  onChange={(item) => { if (item) setRsmiForm({ ...rsmiForm, supply_item_id: item.id, item_name: item.item_name, unit: item.unit, section: item.category }) }}
                  onAddNew={(name) => setRsmiForm({ ...rsmiForm, item_name: name })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.section} onChange={e => setRsmiForm({ ...rsmiForm, section: e.target.value })}>
                  <option value="">Select</option>
                  {config.sections.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Unit</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.unit} onChange={e => setRsmiForm({ ...rsmiForm, unit: e.target.value })}>
                  <option value="">Select</option>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Qty Issued *</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.quantity_issued} onChange={e => setRsmiForm({ ...rsmiForm, quantity_issued: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Unit Cost</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.unit_cost} onChange={e => setRsmiForm({ ...rsmiForm, unit_cost: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Division</label>
                <SmartDropdown options={DIVISIONS} value={rsmiForm.division} placeholder="Select or type custom..."
                  onChange={(val) => setRsmiForm({ ...rsmiForm, division: val })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Office</label>
                <SmartDropdown options={OFFICES} value={rsmiForm.office} placeholder="Select or type custom..."
                  onChange={(val) => setRsmiForm({ ...rsmiForm, office: val })} />
              </div>
              {isAgri && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Location / Municipality</label>
                  <SmartDropdown options={LOCATIONS} value={rsmiForm.location || ''} placeholder="Type or select municipality..."
                    onChange={(val) => setRsmiForm({ ...rsmiForm, location: val })} />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fiscal Year</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.fiscal_year} onChange={e => setRsmiForm({ ...rsmiForm, fiscal_year: e.target.value })}>
                  {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Requested By</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.requested_by} onChange={e => setRsmiForm({ ...rsmiForm, requested_by: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Resp. Center Code</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.resp_center_code} onChange={e => setRsmiForm({ ...rsmiForm, resp_center_code: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">P.O. No.</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={rsmiForm.po_no} onChange={e => setRsmiForm({ ...rsmiForm, po_no: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowRsmiModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveRsmi} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800">{editRsmiId ? 'Save Changes' : 'Add Entry'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 