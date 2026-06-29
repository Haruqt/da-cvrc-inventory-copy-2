const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/database')

const SECRET = 'dacvrc_inventory_secret_2025'

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin')
if (!existingUser) {
  const hashed = bcrypt.hashSync('supplyoffice', 10)
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashed, 'admin')
  console.log('✅ Default admin created — username: admin, password: supplyoffice')
} else {
  const hashed = bcrypt.hashSync('supplyoffice', 10)
  db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashed, 'admin')
  console.log('✅ Admin password updated — username: admin, password: supplyoffice')
}

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) return res.status(401).json({ error: 'Invalid username or password' })
  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid username or password' })
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '8h' }
  )
  res.json({ token, username: user.username, role: user.role })
})

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'No token provided' })
  try {
    const token = auth.split(' ')[1]
    req.user = jwt.verify(token, SECRET)
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

router.get('/me', verifyToken, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role })
})

router.put('/change-password', verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const valid = bcrypt.compareSync(oldPassword, user.password)
  if (!valid) return res.status(400).json({ error: 'Old password is incorrect' })
  const hashed = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id)
  res.json({ message: 'Password changed successfully' })
})

module.exports = { router, verifyToken }