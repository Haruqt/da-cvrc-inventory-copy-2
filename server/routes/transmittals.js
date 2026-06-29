const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/', (req, res) => {
  const { search, status, fiscal_year } = req.query
  let query = 'SELECT * FROM transmittals WHERE 1=1'
  const params = []

  if (search) {
    query += ' AND (document_title LIKE ? OR sent_by LIKE ? OR sent_to LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
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
  const item = db.prepare('SELECT * FROM transmittals WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', (req, res) => {
  const { document_title, document_type, date_sent, sent_by, sent_to, office_destination, remarks, status, fiscal_year } = req.body
  const result = db.prepare(`
    INSERT INTO transmittals (document_title, document_type, date_sent, sent_by, sent_to, office_destination, remarks, status, fiscal_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(document_title, document_type, date_sent, sent_by, sent_to,
    office_destination, remarks, status || 'pending',
    fiscal_year || new Date().getFullYear())
  res.json({ id: result.lastInsertRowid, message: 'Created successfully' })
})

router.put('/:id', (req, res) => {
  const { document_title, document_type, date_sent, sent_by, sent_to, office_destination, remarks, status, fiscal_year } = req.body
  db.prepare(`
    UPDATE transmittals SET
      document_title=?, document_type=?, date_sent=?, sent_by=?,
      sent_to=?, office_destination=?, remarks=?, status=?, fiscal_year=?
    WHERE id=?
  `).run(document_title, document_type, date_sent, sent_by, sent_to,
    office_destination, remarks, status, fiscal_year, req.params.id)
  res.json({ message: 'Updated successfully' })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transmittals WHERE id = ?').run(req.params.id)
  res.json({ message: 'Deleted successfully' })
})

module.exports = router