require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const helmet = require('helmet')
const morgan = require('morgan')

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://vue-frontend:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

app.post('/api/claude/messages', async (req, res) => {
  console.log('Claude API request received')
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey || apiKey === 'your_claude_api_key_here') {
    return res.status(500).json({ error: 'API key not configured' })
  }
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      timeout: 60000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    console.error('Claude API error:', error.message)
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data })
    } else {
      res.status(503).json({ error: 'Network Error' })
    }
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Claude API Proxy' })
})

app.get('/api/status', (req, res) => {
  const apiKey = process.env.CLAUDE_API_KEY
  res.json({ configured: apiKey && apiKey !== 'your_claude_api_key_here' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('Claude API Proxy started on port ' + PORT)
})