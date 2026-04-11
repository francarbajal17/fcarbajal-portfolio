import { NextResponse } from 'next/server'
import { getData } from '@/lib/data'
import { getDb } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { ObjectId } from 'mongodb'

export async function GET() {
  const data = await getData()
  return NextResponse.json(data)
}

// Upload a new image and add it to the database
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const section = (formData.get('section') as string) || 'portfolio'
  const title = (formData.get('title') as string) || ''
  const cat = (formData.get('cat') as string) || 'landscape'
  const loc = (formData.get('loc') as string) || ''

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection('images')

  if (section === 'hero') {
    const heroCount = await col.countDocuments({ section: 'hero' })
    if (heroCount >= 5) {
      return NextResponse.json(
        { error: 'El hero ya tiene 5 fotos (máximo permitido)' },
        { status: 400 }
      )
    }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${uuid()}.${ext}`
  const photosDir = path.join(process.cwd(), 'public/photos')

  if (!existsSync(photosDir)) await mkdir(photosDir, { recursive: true })
  await writeFile(path.join(photosDir, filename), buffer)

  // Place new image at the end of its section
  const lastInSection = await col
    .find({ section })
    .sort({ order: -1 })
    .limit(1)
    .toArray()
  const order = lastInSection.length > 0 ? lastInSection[0].order + 1 : 0

  const doc = {
    url: `/photos/${filename}`,
    title,
    cat: cat as 'landscape' | 'street' | 'portrait',
    loc,
    section: section as 'hero' | 'portfolio',
    order,
  }

  const result = await col.insertOne(doc)

  return NextResponse.json({
    ok: true,
    image: { ...doc, _id: result.insertedId.toString() },
  })
}

// Bulk update metadata and order for all photos
export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { photos } = await req.json() as {
    photos: Array<{ id: string; title: string; cat: string; loc: string; section: string; order: number }>
  }

  const db = await getDb()
  const col = db.collection('images')

  await Promise.all(
    photos.map(p =>
      col.updateOne(
        { _id: new ObjectId(p.id) },
        { $set: { title: p.title, cat: p.cat, loc: p.loc, section: p.section, order: p.order } }
      )
    )
  )

  return NextResponse.json({ ok: true })
}
