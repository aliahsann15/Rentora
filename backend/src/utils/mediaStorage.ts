import fs from 'fs/promises'
import path from 'path'

export type MediaCategory = 'properties' | 'tenants' | 'vendors' | 'landlords'

type StoredMediaFileInput = {
  buffer: Buffer
  category: MediaCategory
  mimeType: string
  originalName: string
  ownerEmail?: string
  ownerId?: string
  ownerName?: string
  purpose: string
}

export const mediaRoot = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.resolve(__dirname, '../../media')

const mimeExtensions: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

export const allowedImageMimeTypes = new Set(Object.keys(mimeExtensions))

const createSearchableSlug = (value?: string): string => {
  const slug = (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'unknown'
}

const getExtension = (mimeType: string, originalName: string): string => {
  if (mimeExtensions[mimeType]) {
    return mimeExtensions[mimeType]
  }

  const extension = path.extname(originalName).replace('.', '').toLowerCase()
  return extension || 'jpg'
}

export const getMediaCategoryForUserRole = (role: string): MediaCategory => {
  if (role === 'TENANT') {
    return 'tenants'
  }

  if (role === 'VENDOR') {
    return 'vendors'
  }

  return 'landlords'
}

export const storeMediaFile = async ({
  buffer,
  category,
  mimeType,
  originalName,
  ownerEmail,
  ownerId,
  ownerName,
  purpose
}: StoredMediaFileInput): Promise<string> => {
  const categoryDirectory = path.join(mediaRoot, category)
  await fs.mkdir(categoryDirectory, { recursive: true })

  const extension = getExtension(mimeType, originalName)
  const searchableParts = [
    createSearchableSlug(purpose),
    createSearchableSlug(ownerName),
    createSearchableSlug(ownerEmail),
    createSearchableSlug(ownerId).slice(-8),
    Date.now().toString()
  ]
  const fileName = `${searchableParts.join('-')}.${extension}`
  const filePath = path.join(categoryDirectory, fileName)

  await fs.writeFile(filePath, buffer)

  return `/media/${category}/${fileName}`
}
