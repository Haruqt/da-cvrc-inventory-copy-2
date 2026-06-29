const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/', (req, res) => {
  const { search, category, status, fiscal_year } = req.query
  let query = 'SELECT * FROM iirup_items WHERE 1=1'
  const params = []

  if (search) {
    query += ' AND (particulars LIKE ? OR property_no LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }
  if (status) {
    query += ' AND disposal_status = ?'
    params.push(status)
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
  const item = db.prepare('SELECT * FROM iirup_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', (req, res) => {
  const {
    property_no, particulars, category, date_acquired,
    quantity, unit_cost, total_cost, accumulated_depreciation,
    carrying_amount, disposal_type, disposal_status, remarks,
    report_date, fiscal_year
  } = req.body

  const result = db.prepare(`
    INSERT INTO iirup_items (
      property_no, particulars, category, date_acquired,
      quantity, unit_cost, total_cost, accumulated_depreciation,
      carrying_amount, disposal_type, disposal_status, remarks,
      report_date, fiscal_year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    property_no, particulars, category, date_acquired,
    quantity, unit_cost, total_cost, accumulated_depreciation,
    carrying_amount, disposal_type, disposal_status || 'pending',
    remarks, report_date, fiscal_year || new Date().getFullYear()
  )
  res.json({ id: result.lastInsertRowid, message: 'Created successfully' })
})

router.put('/:id', (req, res) => {
  const {
    property_no, particulars, category, date_acquired,
    quantity, unit_cost, total_cost, accumulated_depreciation,
    carrying_amount, disposal_type, disposal_status, remarks,
    report_date, fiscal_year
  } = req.body

  db.prepare(`
    UPDATE iirup_items SET
      property_no=?, particulars=?, category=?, date_acquired=?,
      quantity=?, unit_cost=?, total_cost=?, accumulated_depreciation=?,
      carrying_amount=?, disposal_type=?, disposal_status=?, remarks=?,
      report_date=?, fiscal_year=?
    WHERE id=?
  `).run(
    property_no, particulars, category, date_acquired,
    quantity, unit_cost, total_cost, accumulated_depreciation,
    carrying_amount, disposal_type, disposal_status, remarks,
    report_date, fiscal_year, req.params.id
  )
  res.json({ message: 'Updated successfully' })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM iirup_items WHERE id = ?').run(req.params.id)
  res.json({ message: 'Deleted successfully' })
})

module.exports = router