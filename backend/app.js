import cors from 'cors'
import express from 'express'
import fs from 'fs'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import dormRoutes from './routes/dormRoutes.js'
import roomRoutes from './routes/roomRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import catalogRequestRoutes from './routes/catalogRequestRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import maintenanceRoutes from './routes/maintenanceRoutes.js'
import supportRoutes from './routes/supportRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import superAdminRoutes from './routes/superAdminRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import translateRoutes from './routes/translateRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../frontend/dist')
const frontendIndexPath = path.join(frontendDistPath, 'index.html')
const uploadsPath = path.resolve(__dirname, 'uploads')

const app = express()
const serveFrontendAssets = express.static(frontendDistPath)

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const allowedOrigins = new Set([
  ...parseAllowedOrigins(env.clientUrl),
  `http://localhost:${env.port}`,
  `http://127.0.0.1:${env.port}`,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
])

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(morgan('dev'))
app.use('/uploads', express.static(uploadsPath))

function hasFrontendBuild() {
  return fs.existsSync(frontendIndexPath)
}

function clientUrlFor(pathname = '/') {
  const baseUrl = String(env.clientUrl || 'http://localhost:5173').replace(/\/+$/, '')
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${baseUrl}${normalizedPath}`
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DormDoor API is running',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/dorms', dormRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/catalog-requests', catalogRequestRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/translate', translateRoutes)

app.use((req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    next()
    return
  }

  serveFrontendAssets(req, res, next)
})

app.get('/', (req, res) => {
  if (hasFrontendBuild()) {
    res.sendFile(frontendIndexPath)
    return
  }

  res.redirect(clientUrlFor('/'))
})

app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
  if (hasFrontendBuild()) {
    res.sendFile(frontendIndexPath)
    return
  }

  res.redirect(clientUrlFor(req.originalUrl))
})

app.use(notFound)
app.use(errorHandler)

export default app
