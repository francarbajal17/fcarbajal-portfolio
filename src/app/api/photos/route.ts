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

// Save full data (order, metadata, covers)
export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  await saveData(body)
  return NextResponse.json({ ok: true })
}

// Upload a new photo or cover image
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file    = formData.get('file')    as File
  const title   = formData.get('title')   as string || 'Sin título'
  const cat     = formData.get('cat')     as string || 'landscape'
  const loc     = formData.get('loc')     as string || 'Montevideo'
  const isCover = formData.get('isCover') === 'true'

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${uuid()}.${ext}`
  let filePath: string

  if (process.env.BLOB_PHOTOS_TOKEN) {
    // Production: store in a dedicated public blob store
    const { put } = await import('@vercel/blob')
    const blob = await put(`photos/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_PHOTOS_TOKEN,
    })
    filePath = blob.url
  } else {
    // Local dev fallback: write to public/photos/
    const bytes     = await file.arrayBuffer()
    const buffer    = Buffer.from(bytes)
    const photosDir = path.join(process.cwd(), 'public/photos')
    if (!existsSync(photosDir)) await mkdir(photosDir, { recursive: true })
    await writeFile(path.join(photosDir, filename), buffer)
    filePath = `/photos/${filename}`
  }

  if (isCover) {
    return NextResponse.json({ ok: true, photo: { file: filePath } })
  }

  const data = await getData()
  const newPhoto = {
    id:   uuid(),
    title,
    cat:  cat as 'landscape' | 'street' | 'portrait',
    loc,
    file: filePath,
  }
  data.photos.push(newPhoto)
  await saveData(data)

  return NextResponse.json({ ok: true, photo: newPhoto })
}
