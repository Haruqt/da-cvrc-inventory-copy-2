const express = require('express')
const router = express.Router()
const db = require('../db/database')

// ─── SUPPLY ITEMS ───────────────────────────────────────

router.get('/items', (req, res) => {
  try {
    const { search, category, section, fiscal_year } = req.query
    let query = 'SELECT * FROM supply_items WHERE 1=1'
    const params = []
    if (search) { query += ' AND item_name LIKE ?'; params.push(`%${search}%`) }
    if (category) { query += ' AND category = ?'; params.push(category) }
    if (section) { query += ' AND section = ?'; params.push(section) }
    if (fiscal_year) { query += ' AND fiscal_year = ?'; params.push(fiscal_year) }
    query += ' ORDER BY category, item_name'
    res.json(db.prepare(query).all(...params))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/items', (req, res) => {
  try {
    const { item_name, category, section, unit, quantity_in, unit_cost, division, office, remarks, fiscal_year, performed_by } = req.body
    const resolvedSection = section || category || 'General'
    const resolvedCategory = category || resolvedSection
    const addQty = Number(quantity_in) || 0
    const year = Number(fiscal_year) || new Date().getFullYear()

    const existing = db.prepare(
      'SELECT * FROM supply_items WHERE item_name = ? AND category = ? AND fiscal_year = ?'
    ).get(item_name, resolvedCategory, year)

    if (existing) {
      const newQtyIn = (existing.quantity_in || 0) + addQty
      const newBalance = newQtyIn - (existing.quantity_out || 0)
      db.prepare(`UPDATE supply_items SET quantity_in=?, balance=?, unit_cost=?, division=?, office=?, remarks=? WHERE id=?`)
        .run(newQtyIn, newBalance, unit_cost || existing.unit_cost || 0, division || existing.division, office || existing.office, remarks || existing.remarks || '', existing.id)
      try {
        db.prepare(`INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year) VALUES (?, ?, ?, 'RESTOCKED', ?, ?, ?, ?, ?, ?)`)
          .run(existing.id, item_name, resolvedSection, addQty, existing.balance, newBalance, performed_by || 'admin', `Added ${addQty} ${unit} to existing stock`, year)
      } catch (e) {}
      return res.json({ id: existing.id, message: 'Stock updated (added to existing)' })
    }

    const result = db.prepare(`INSERT INTO supply_items (item_name, category, section, unit, quantity_in, quantity_out, balance, unit_cost, division, office, remarks, fiscal_year) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`)
      .run(item_name, resolvedCategory, resolvedSection, unit, addQty, addQty, unit_cost || 0, division || '', office || '', remarks || '', year)
    try {
      db.prepare(`INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year) VALUES (?, ?, ?, 'ADDED', ?, 0, ?, ?, ?, ?)`)
        .run(result.lastInsertRowid, item_name, resolvedSection, addQty, addQty, performed_by || 'admin', `Item added with ${addQty} stock`, year)
    } catch (e) {}
    res.json({ id: result.lastInsertRowid, message: 'Created successfully' })
  } catch (err) {
    console.error('POST /items error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/items/bulk', (req, res) => {
  try {
    const { items, fiscal_year, performed_by, skipDuplicates } = req.body
    const year = Number(fiscal_year) || new Date().getFullYear()
    const results = []
    const skipped = []

    for (const item of items) {
      if (!item.item_name || !item.unit) continue
      const resolvedSection = item.section || item.category || 'General'
      const resolvedCategory = item.category || resolvedSection

      if (skipDuplicates) {
        const existing = db.prepare('SELECT id FROM supply_items WHERE item_name = ? AND category = ? AND fiscal_year = ?').get(item.item_name, resolvedCategory, year)
        if (existing) { skipped.push(item.item_name); continue }
      }

      const balance = Number(item.quantity_in) || 0
      try {
        const result = db.prepare(`INSERT INTO supply_items (item_name, category, section, unit, quantity_in, quantity_out, balance, unit_cost, division, office, remarks, fiscal_year) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`)
          .run(item.item_name, resolvedCategory, resolvedSection, item.unit, balance, balance, item.unit_cost || 0, item.division || '', item.office || '', item.remarks || '', year)
        try {
          db.prepare(`INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year) VALUES (?, ?, ?, 'BULK ADDED', ?, 0, ?, ?, ?, ?)`)
            .run(result.lastInsertRowid, item.item_name, resolvedSection, balance, balance, performed_by || 'admin', 'Bulk import', year)
        } catch (e) {}
        results.push(result.lastInsertRowid)
      } catch (e) { console.error('Bulk insert error:', item.item_name, e.message) }
    }

    res.json({ count: results.length, skipped: skipped.length, message: `${results.length} items added${skipped.length > 0 ? `, ${skipped.length} skipped` : ''}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/items/:id', (req, res) => {
  try {
    const { item_name, category, section, unit, quantity_in, unit_cost, division, office, remarks, fiscal_year, performed_by } = req.body
    const resolvedSection = section || category || 'General'
    const old = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(req.params.id)
    const newQtyIn = Number(quantity_in) || 0
    const newBalance = newQtyIn - (old?.quantity_out || 0)
    db.prepare(`UPDATE supply_items SET item_name=?, category=?, section=?, unit=?, quantity_in=?, balance=?, unit_cost=?, division=?, office=?, remarks=?, fiscal_year=? WHERE id=?`)
      .run(item_name, category || resolvedSection, resolvedSection, unit, newQtyIn, newBalance, unit_cost || 0, division || '', office || '', remarks || '', fiscal_year, req.params.id)
    try {
      db.prepare(`INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year) VALUES (?, ?, ?, 'EDITED', ?, ?, ?, ?, ?, ?)`)
        .run(req.params.id, item_name, resolvedSection, newQtyIn - (old?.quantity_in || 0), old?.balance, newBalance, performed_by || 'admin', 'Item updated', fiscal_year)
    } catch (e) {}
    res.json({ message: 'Updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/items/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(req.params.id)
    try {
      db.prepare(`INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year) VALUES (?, ?, ?, 'DELETED', ?, ?, 0, ?, ?, ?)`)
        .run(req.params.id, item?.item_name, item?.section || 'General', item?.balance, item?.balance, 'admin', 'Item deleted', item?.fiscal_year)
    } catch (e) {}
    db.prepare('DELETE FROM supply_items WHERE id = ?').run(req.params.id)
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/items/clear/all', (req, res) => {
  try {
    db.prepare('DELETE FROM supply_items').run()
    db.prepare('DELETE FROM rsmi_records').run()
    db.prepare('DELETE FROM supply_history').run()
    res.json({ message: 'All supply data cleared!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── RSMI RECORDS ───────────────────────────────────────

// Generate next RIS number for the year — format: YYYY-MM-NNN, counts sequentially all year
router.get('/rsmi/next-ris/:year', (req, res) => {
  try {
    const year = req.params.year
    const count = db.prepare(
      `SELECT COUNT(*) as count FROM rsmi_records WHERE ris_no LIKE ?`
    ).get(`${year}-%`)
    const nextNum = (count.count || 0) + 1
    const month = new Date().getMonth() + 1
    const risNo = `${year}-${String(month).padStart(2, '0')}-${String(nextNum).padStart(3, '0')}`
    res.json({ ris_no: risNo })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/rsmi', (req, res) => {
  try {
    const { search, fiscal_year, month, section } = req.query
    let query = 'SELECT * FROM rsmi_records WHERE 1=1'
    const params = []
    if (search) { query += ' AND (item_name LIKE ? OR requested_by LIKE ? OR ris_no LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
    if (fiscal_year) { query += ' AND fiscal_year = ?'; params.push(fiscal_year) }
    if (month) { query += ' AND strftime("%m", date_issued) = ?'; params.push(month.toString().padStart(2, '0')) }
    if (section) { query += ' AND section = ?'; params.push(section) }
    query += ' ORDER BY date_issued DESC, created_at DESC'
    res.json(db.prepare(query).all(...params))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/rsmi', (req, res) => {
  try {
    const { ris_no, supply_item_id, item_name, section, unit, quantity_issued, unit_cost, division, office, location, requested_by, resp_center_code, po_no, stock_no, date_issued, fiscal_year } = req.body
    const resolvedSection = section || 'General'
    const amount = (Number(quantity_issued) || 0) * (Number(unit_cost) || 0)
    const year = Number(fiscal_year) || new Date().getFullYear()

    // Check stock before issuing
    if (supply_item_id) {
      const item = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(supply_item_id)
      if (item) {
        const newBalance = (item.quantity_in || 0) - (item.quantity_out || 0) - (Number(quantity_issued) || 0)
        if (newBalance < 0) {
          return res.status(400).json({
            error: `⚠️ Not enough stock! Available: ${item.balance}, Requested: ${quantity_issued}. Please restock first.`,
            available: item.balance
          })
        }
      }
    }

    const result = db.prepare(`
      INSERT INTO rsmi_records (ris_no, supply_item_id, item_name, section, unit, quantity_issued, unit_cost, amount, division, office, location, requested_by, resp_center_code, po_no, stock_no, date_issued, fiscal_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ris_no || '', supply_item_id || null, item_name, resolvedSection, unit || '', quantity_issued, unit_cost || 0, amount, division || '', office || '', location || '', requested_by || '', resp_center_code || '', po_no || '', stock_no || '', date_issued || '', year)

    if (supply_item_id) {
      try {
        const item = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(supply_item_id)
        if (item) {
          const newOut = (item.quantity_out || 0) + (Number(quantity_issued) || 0)
          const newBalance = (item.quantity_in || 0) - newOut
          db.prepare('UPDATE supply_items SET quantity_out=?, balance=? WHERE id=?').run(newOut, newBalance, supply_item_id)
          db.prepare(`
            INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year)
            VALUES (?, ?, ?, 'ISSUED', ?, ?, ?, ?, ?, ?)
          `).run(supply_item_id, item_name, resolvedSection, quantity_issued, item.balance, newBalance, requested_by || 'admin', `Issued via RIS No. ${ris_no || '—'}`, year)
        }
      } catch (e) {}
    }

    res.json({ id: result.lastInsertRowid, message: 'Issued successfully' })
  } catch (err) {
    console.error('POST /rsmi error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/rsmi/bulk', (req, res) => {
  try {
    const { records, fiscal_year } = req.body
    const year = Number(fiscal_year) || new Date().getFullYear()
    let count = 0
    const errors = []

    for (const r of records) {
      if (!r.item_name || !r.quantity_issued) continue

      // Check stock
      if (r.supply_item_id) {
        const item = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(r.supply_item_id)
        if (item) {
          const newBalance = (item.quantity_in || 0) - (item.quantity_out || 0) - (Number(r.quantity_issued) || 0)
          if (newBalance < 0) {
            errors.push(`${r.item_name}: Not enough stock (Available: ${item.balance}, Requested: ${r.quantity_issued})`)
            continue
          }
        }
      }

      const amount = (Number(r.quantity_issued) || 0) * (Number(r.unit_cost) || 0)
      db.prepare(`
        INSERT INTO rsmi_records (ris_no, supply_item_id, item_name, section, unit, quantity_issued, unit_cost, amount, division, office, location, requested_by, resp_center_code, po_no, stock_no, date_issued, fiscal_year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(r.ris_no || '', r.supply_item_id || null, r.item_name, r.section || 'General', r.unit || '', r.quantity_issued, r.unit_cost || 0, amount, r.division || '', r.office || '', r.location || '', r.requested_by || '', r.resp_center_code || '', r.po_no || '', r.stock_no || '', r.date_issued || '', year)

      if (r.supply_item_id) {
        try {
          const item = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(r.supply_item_id)
          if (item) {
            const newOut = (item.quantity_out || 0) + (Number(r.quantity_issued) || 0)
            const newBalance = (item.quantity_in || 0) - newOut
            db.prepare('UPDATE supply_items SET quantity_out=?, balance=? WHERE id=?').run(newOut, newBalance, r.supply_item_id)
          }
        } catch (e) {}
      }
      count++
    }

    let message = `${count} records issued successfully`
    if (errors.length > 0) message += `\n\n⚠️ Skipped (insufficient stock):\n${errors.join('\n')}`
    res.json({ count, errors, message })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/rsmi/:id', (req, res) => {
  try {
    const { ris_no, item_name, section, unit, quantity_issued, unit_cost, division, office, location, requested_by, resp_center_code, po_no, stock_no, date_issued, fiscal_year } = req.body
    const amount = (Number(quantity_issued) || 0) * (Number(unit_cost) || 0)
    db.prepare(`
      UPDATE rsmi_records SET ris_no=?, item_name=?, section=?, unit=?, quantity_issued=?, unit_cost=?, amount=?, division=?, office=?, location=?, requested_by=?, resp_center_code=?, po_no=?, stock_no=?, date_issued=?, fiscal_year=?
      WHERE id=?
    `).run(ris_no || '', item_name, section || 'General', unit || '', quantity_issued, unit_cost || 0, amount, division || '', office || '', location || '', requested_by || '', resp_center_code || '', po_no || '', stock_no || '', date_issued || '', fiscal_year, req.params.id)
    res.json({ message: 'Updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/rsmi/:id', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM rsmi_records WHERE id = ?').get(req.params.id)
    if (record?.supply_item_id) {
      try {
        const item = db.prepare('SELECT * FROM supply_items WHERE id = ?').get(record.supply_item_id)
        if (item) {
          const newOut = Math.max(0, (item.quantity_out || 0) - (record.quantity_issued || 0))
          const newBalance = (item.quantity_in || 0) - newOut
          db.prepare('UPDATE supply_items SET quantity_out=?, balance=? WHERE id=?').run(newOut, newBalance, record.supply_item_id)
          db.prepare(`
            INSERT INTO supply_history (supply_item_id, item_name, section, action, quantity_changed, old_balance, new_balance, performed_by, notes, fiscal_year)
            VALUES (?, ?, ?, 'ISSUANCE DELETED', ?, ?, ?, ?, ?, ?)
          `).run(record.supply_item_id, record.item_name, record.section || 'General', record.quantity_issued, item.balance, newBalance, 'admin', 'RSMI deleted, stock restored', record.fiscal_year)
        }
      } catch (e) {}
    }
    db.prepare('DELETE FROM rsmi_records WHERE id = ?').run(req.params.id)
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── HISTORY ────────────────────────────────────────────

router.get('/history', (req, res) => {
  try {
    const { section, fiscal_year, action } = req.query
    let query = 'SELECT * FROM supply_history WHERE 1=1'
    const params = []
    if (section) { query += ' AND section = ?'; params.push(section) }
    if (fiscal_year) { query += ' AND fiscal_year = ?'; params.push(fiscal_year) }
    if (action) { query += ' AND action = ?'; params.push(action) }
    query += ' ORDER BY created_at DESC'
    res.json(db.prepare(query).all(...params))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
