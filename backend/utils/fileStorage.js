import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRoot = path.resolve(__dirname, '../uploads')

const extensionByMimeType = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/heic', '.heic'],
  ['image/heif', '.heif'],
  ['application/pdf', '.pdf'],
])

function safeSegment(value, fallback = 'file') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || fallback
}

function extensionFor(file) {
  const mimeType = String(file?.mimetype || '').toLowerCase()
  const mapped = extensionByMimeType.get(mimeType)
  if (mapped) return mapped

  const originalExtension = path.extname(String(file?.originalname || '')).toLowerCase()
  return originalExtension && originalExtension.length <= 10 ? originalExtension : '.bin'
}

export async function saveUploadedFile(file, folder = 'files', prefix = 'file') {
  if (!file?.buffer) return ''

  const safeFolder = safeSegment(folder, 'files')
  const safePrefix = safeSegment(prefix, 'file')
  const targetDir = path.join(uploadsRoot, safeFolder)
  await fs.promises.mkdir(targetDir, { recursive: true })

  const fileName = `${safePrefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extensionFor(file)}`
  const filePath = path.join(targetDir, fileName)
  await fs.promises.writeFile(filePath, file.buffer)

  return `/uploads/${safeFolder}/${fileName}`
}

export async function saveUploadedFiles(files = [], folder = 'files', prefix = 'file') {
  const normalizedFiles = Array.isArray(files) ? files : []
  return Promise.all(normalizedFiles.map((file) => saveUploadedFile(file, folder, prefix)))
}
