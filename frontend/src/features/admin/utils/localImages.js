export const MAX_LOCAL_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_LOCAL_IMAGE_LABEL = '10MB'

function readPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export async function collectLocalImages(fileList, { existing = [], maxFiles = 6 } = {}) {
  const files = Array.from(fileList || [])
  if (!files.length) {
    return { images: existing, message: '' }
  }

  const remaining = Math.max(maxFiles - existing.length, 0)
  if (remaining <= 0) {
    return { images: existing, message: `You can upload up to ${maxFiles} photos.` }
  }

  const selectedFiles = files.slice(0, remaining)
  const invalidFile = selectedFiles.find((file) => !String(file.type || '').startsWith('image/'))
  if (invalidFile) {
    return { images: existing, message: `${invalidFile.name} is not an image file.` }
  }

  const oversizedFile = selectedFiles.find((file) => file.size > MAX_LOCAL_IMAGE_BYTES)
  if (oversizedFile) {
    return { images: existing, message: `${oversizedFile.name} must be ${MAX_LOCAL_IMAGE_LABEL} or smaller.` }
  }

  const previews = await Promise.all(selectedFiles.map(readPreview))
  const createdAt = Date.now()
  const nextImages = selectedFiles.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${file.size}-${createdAt}-${index}`,
    file,
    name: file.name,
    preview: previews[index],
  }))

  return {
    images: [...existing, ...nextImages],
    message: files.length > remaining ? `Only the first ${remaining} photo${remaining === 1 ? '' : 's'} were added.` : '',
  }
}
