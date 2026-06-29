const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/', (req, res) => {
  const { search, status, fiscal_year } = req.query
  let query = 'SELECT * FROM contracts WHERE 1=1'
  const params = []

  if (search) {
    query += ' AND (dealer_supplier LIKE ? OR contract_no LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (status) {
    query += ' AND status = ?'
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
  const item = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', (req, res) => {
  const { item_no, dealer_supplier, contract_no, amount, contract_period, status, fiscal_year } = req.body
  const result = db.prepare(`
    INSERT INTO contracts (item_no, dealer_supplier, contract_no, amount, contract_period, status, fiscal_year)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(item_no, dealer_supplier, contract_no, amount, contract_period,
    status || 'unpaid', fiscal_year || new Date().getFullYear())
  res.json({ id: result.lastInsertRowid, message: 'Created successfully' })
})

router.put('/:id', (req, res) => {
  const { item_no, dealer_supplier, contract_no, amount, contract_period, status, fiscal_year } = req.body
  db.prepare(`
    UPDATE contracts SET
      item_no=?, dealer_supplier=?, contract_no=?, amount=?,
      contract_period=?, status=?, fiscal_year=?
    WHERE id=?
  `).run(item_no, dealer_supplier, contract_no, amount,
    contract_period, status, fiscal_year, req.params.id)
  res.json({ message: 'Updated successfully' })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id)
  res.json({ message: 'Deleted successfully' })
})

module.exports = router