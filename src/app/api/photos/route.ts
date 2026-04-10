import { NextResponse } from 'next/server'
import { getData, saveData } from '@/lib/data'
import { isAuthenticated } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'

export async function GET() {
  const data = await getData()
  return NextResponse.json(data)
}

// Save photo data (order, metadata, covers)
export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  await saveData(body)
  return NextResponse.json({ ok: true })
}

// Upload new photo
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string || 'Sin título'
  const cat   = formData.get('cat')   as string || 'landscape'
  const loc   = formData.get('loc')   as string || 'Montevideo'

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${uuid()}.${ext}`
  const photosDir = path.join(process.cwd(), 'public/photos')

  if (!existsSync(photosDir)) await mkdir(photosDir, { recursive: true })
  await writeFile(path.join(photosDir, filename), buffer)

  const data = await getData()
  const newPhoto = {
    id: uuid(),
    title,
    cat: cat as 'landscape' | 'street' | 'portrait',
    loc,
    file: `/photos/${filename}`,
  }
  data.photos.push(newPhoto)
  await saveData(data)

  return NextResponse.json({ ok: true, photo: newPhoto })
}
