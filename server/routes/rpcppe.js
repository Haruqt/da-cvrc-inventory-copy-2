const express = require('express')
const router = express.Router()
const db = require('../db/database')
 
// Helper: always derive shortage_overage server-side so it can never drift
// out of sync with on_hand_per_count / balance_per_card, no matter which
// route (single add, edit, bulk add, paste import) touched the row.
function calcShortageOverage(on_hand_per_count, balance_per_card) {
  const onHand = Number(on_hand_per_count) || 0
  const balance = Number(balance_per_card) || 0
  return onHand - balance
}
 
router.get('/', (req, res) => {
  const { search, ppe_type, fund_cluster, fiscal_year } = req.query
  let query = 'SELECT * FROM rpcppe_items WHERE 1=1'
  const params = []
 
  if (search) {
    query += ' AND (description LIKE ? OR property_number LIKE ? OR accountable_person LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (ppe_type) {
    query += ' AND ppe_type = ?'
    params.push(ppe_type)
  }
  if (fund_cluster) {
    query += ' AND fund_cluster = ?'
    params.push(fund_cluster)
  }
  if (fiscal_year) {
    query += ' AND fiscal_year = ?'
    params.push(fiscal_year)
  }
 
  query += ' ORDER BY created_at DESC'
  const items = db.prepare(query).all(...params)
  res.json(items)
})
 
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM rpcppe_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})
 
router.post('/', (req, res) => {
  const {
    article_no, description, property_number, unit_of_measure,
    unit_value, balance_per_card, on_hand_per_count,
    remarks, accountable_person, date_acquired, location,
    ppe_type, fund_cluster, report_date, fiscal_year
  } = req.body
 
  if (!description) return res.status(400).json({ error: 'Description is required' })
 
  const shortage_overage = calcShortageOverage(on_hand_per_count, balance_per_card)
 
  const result = db.prepare(`
    INSERT INTO rpcppe_items (
      article_no, description, property_number, unit_of_measure,
      unit_value, balance_per_card, on_hand_per_count, shortage_overage,
      remarks, accountable_person, date_acquired, location,
      ppe_type, fund_cluster, report_date, fiscal_year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    article_no, description, property_number, unit_of_measure,
    unit_value, balance_per_card, on_hand_per_count, shortage_overage,
    remarks, accountable_person, date_acquired, location,
    ppe_type, fund_cluster, report_date,
    fiscal_year || new Date().getFullYear()
  )
  res.json({ id: result.lastInsertRowid, message: 'Created successfully' })
})
 
// Bulk insert — used by both "Bulk Add" (manual rows) and "Paste Import" (from Excel)
router.post('/bulk', (req, res) => {
  const { items, fiscal_year } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' })
  }
 
  const year = fiscal_year || new Date().getFullYear()
  const insert = db.prepare(`
    INSERT INTO rpcppe_items (
      article_no, description, property_number, unit_of_measure,
      unit_value, balance_per_card, on_hand_per_count, shortage_overage,
      remarks, accountable_person, date_acquired, location,
      ppe_type, fund_cluster, report_date, fiscal_year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
 
  const errors = []
  let count = 0
 
  const runAll = db.transaction((rows) => {
    rows.forEach((row, idx) => {
      if (!row.description) {
        errors.push(`Row ${idx + 1}: missing description, skipped`)
        return
      }
      const shortage_overage = calcShortageOverage(row.on_hand_per_count, row.balance_per_card)
      insert.run(
        row.article_no || null, row.description, row.property_number || null, row.unit_of_measure || null,
        row.unit_value || null, row.balance_per_card || null, row.on_hand_per_count || null, shortage_overage,
        row.remarks || null, row.accountable_person || null, row.date_acquired || null, row.location || null,
        row.ppe_type || null, row.fund_cluster || null, row.report_date || null, row.fiscal_year || year
      )
      count++
    })
  })
 
  runAll(items)
 
  res.json({
    count,
    errors,
    message: `${count} record${count !== 1 ? 's' : ''} added successfully${errors.length ? `, ${errors.length} skipped` : ''}`
  })
})
 
router.put('/:id', (req, res) => {
  const {
    article_no, description, property_number, unit_of_measure,
    unit_value, balance_per_card, on_hand_per_count,
    remarks, accountable_person, date_acquired, location,
    ppe_type, fund_cluster, report_date, fiscal_year
  } = req.body
 
  const shortage_overage = calcShortageOverage(on_hand_per_count, balance_per_card)
 
  db.prepare(`
    UPDATE rpcppe_items SET
      article_no=?, description=?, property_number=?, unit_of_measure=?,
      unit_value=?, balance_per_card=?, on_hand_per_count=?, shortage_overage=?,
      remarks=?, accountable_person=?, date_acquired=?, location=?,
      ppe_type=?, fund_cluster=?, report_date=?, fiscal_year=?
    WHERE id=?
  `).run(
    article_no, description, property_number, unit_of_measure,
    unit_value, balance_per_card, on_hand_per_count, shortage_overage,
    remarks, accountable_person, date_acquired, location,
    ppe_type, fund_cluster, report_date, fiscal_year,
    req.params.id
  )
  res.json({ message: 'Updated successfully' })
})
 
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM rpcppe_items WHERE id = ?').run(req.params.id)
  res.json({ message: 'Deleted successfully' })
})
 
module.exports = router