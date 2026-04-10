import { promises as fs } from 'fs'
import path from 'path'
import { unstable_noStore } from 'next/cache'
import defaultData from '@/data/photos.json'

export interface Photo {
  id: string
  title: string
  cat: 'landscape' | 'street' | 'portrait'
  loc: string
  file: string
}

export interface SiteData {
  covers: string[]
  photos: Photo[]
  social: { instagram: string; linkedin: string; vsco: string }
}

const DATA_PATH = path.join(process.cwd(), 'src/data/photos.json')
const BLOB_FILENAME = 'site-data.json'

function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getData(): Promise<SiteData> {
  // Prevent Next.js from caching this — always read fresh data
  unstable_noStore()

  if (isBlobConfigured()) {
    const { list, head } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: BLOB_FILENAME })

    if (blobs.length > 0) {
      // head() returns a short-lived signed downloadUrl — required for private stores
      const { downloadUrl } = await head(blobs[0].url)
      const res = await fetch(downloadUrl, { cache: 'no-store' })
      return res.json() as Promise<SiteData>
    }

    // First run: seed from bundled default data
    const initial = defaultData as SiteData
    await _blobSave(initial)
    return initial
  }

  // Local dev fallback
  const raw = await fs.readFile(DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

export async function saveData(data: SiteData): Promise<void> {
  if (isBlobConfigured()) {
    await _blobSave(data)
    return
  }

  // Local dev fallback
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

async function _blobSave(data: SiteData): Promise<void> {
  const { put } = await import('@vercel/blob')
  await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
}
