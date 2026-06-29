const express = require('express')
const cors = require('cors')
const db = require('./db/database')
const { router: authRouter } = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://da-cvrc-inventory-copy-2.vercel.app'
  ]
}))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/iirup', require('./routes/iirup'))
app.use('/api/ppe', require('./routes/ppe'))
app.use('/api/rpcppe', require('./routes/rpcppe'))
app.use('/api/supplies', require('./routes/supplies'))

app.get('/', (req, res) => {
  res.json({ message: '✅ DA-CVRC Inventory API is running!' })
})

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})