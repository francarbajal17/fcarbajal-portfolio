import { promises as fs } from 'fs'
import path from 'path'

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
  if (isBlobConfigured()) {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: BLOB_FILENAME })

    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url)
      return res.json() as Promise<SiteData>
    }

    // First run: seed Blob from the bundled JSON file
    const raw = await fs.readFile(DATA_PATH, 'utf-8')
    const initial = JSON.parse(raw) as SiteData
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
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  })
}
