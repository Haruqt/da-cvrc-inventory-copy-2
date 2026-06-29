const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/', (req, res) => {
  const { search, division, type, fiscal_year } = req.query
  let query = 'SELECT * FROM ppe_items WHERE 1=1'
  const params = []

  if (search) {
    query += ' AND (description LIKE ? OR property_number LIKE ? OR accountable_person LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (division) {
    query += ' AND division = ?'
    params.push(division)
  }
  if (type) {
    query += ' AND type = ?'
    params.push(type)
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
  const item = db.prepare('SELECT * FROM ppe_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', (req, res) => {
  const {
    no, accountable_person, division, account_name, description,
    property_number, year, date_acquired, amount, quantity,
    remarks, location, sticker_status, type, fiscal_year
  } = req.body

  const result = db.prepare(`
    INSERT INTO ppe_items (
      no, accountable_person, division, account_name, description,
      property_number, year, date_acquired, amount, quantity,
      remarks, location, sticker_status, type, fiscal_year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    no, accountable_person, division, account_name, description,
    property_number, year, date_acquired, amount, quantity,
    remarks, location, sticker_status, type,
    fiscal_year || new Date().getFullYear()
  )
  res.json({ id: result.lastInsertRowid, message: 'Created successfully' })
})

router.put('/:id', (req, res) => {
  const {
    no, accountable_person, division, account_name, description,
    property_number, year, date_acquired, amount, quantity,
    remarks, location, sticker_status, type, fiscal_year
  } = req.body

  db.prepare(`
    UPDATE ppe_items SET
      no=?, accountable_person=?, division=?, account_name=?,
      description=?, property_number=?, year=?, date_acquired=?,
      amount=?, quantity=?, remarks=?, location=?,
      sticker_status=?, type=?, fiscal_year=?
    WHERE id=?
  `).run(
    no, accountable_person, division, account_name, description,
    property_number, year, date_acquired, amount, quantity,
    remarks, location, sticker_status, type, fiscal_year,
    req.params.id
  )
  res.json({ message: 'Updated successfully' })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM ppe_items WHERE id = ?').run(req.params.id)
  res.json({ message: 'Deleted successfully' })
})

module.exports = router