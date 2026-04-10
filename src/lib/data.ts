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

export async function getData(): Promise<SiteData> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

export async function saveData(data: SiteData): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
