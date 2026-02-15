import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Check D2 availability on startup
async function checkD2() {
  try {
    await execAsync('which d2')
    console.log('✓ D2 CLI is available')
    return true
  } catch {
    console.error('✗ D2 CLI not found. Please install D2: https://d2lang.com/tour/install')
    return false
  }
}

// Render D2 to SVG
async function renderD2(d2Source) {
  // Sanitize D2 source - remove common LLM-generated syntax errors
  const sanitized = d2Source
    .replace(/\[\s*\]/g, '')  // Remove empty brackets []
    .replace(/"\s*\[\s*/g, '" ')  // Fix "label" [ -> "label"
    .replace(/"\s*\]\s*/g, '"')   // Fix "label" ] -> "label"
    .trim();
  
  // Use heredoc to properly pass multi-line D2 source
  const escapedSource = sanitized.replace(/'/g, "'\\''");
  const command = `echo '${escapedSource}' | d2 -`;
  const { stdout, stderr } = await execAsync(command, { shell: '/bin/bash' });
  return stdout;
}

app.post('/api/render', async (req, res) => {
  const { d2Source } = req.body
  
  if (!d2Source) {
    return res.status(400).json({ error: 'Missing d2Source in request body' })
  }
  
  try {
    const svg = await renderD2(d2Source)
    res.json({ svg })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to render D2' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function start() {
  await checkD2()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
