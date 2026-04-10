import { NextResponse } from 'next/server'
import { getData, saveData } from '@/lib/data'
import { isAuthenticated } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.BLOB_PHOTOS_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'BLOB_PHOTOS_READ_WRITE_TOKEN not configured' }, { status: 500 })
  }

  // Derive base URL from the incoming request so it works on any deployment
  const { protocol, host } = new URL(req.url)
  const baseUrl = `${protocol}//${host}`

  const data = await getData()
  let migrated = 0

  // ── Migrate cover images ──────────────────────────────────────────────────
  const newCovers: string[] = []
  for (const cover of data.covers) {
    if (!cover.startsWith('/photos/')) {
      newCovers.push(cover) // already a blob URL
      continue
    }
    try {
      const filename = cover.split('/').pop()!
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
      const imgRes = await fetch(`${baseUrl}${cover}`)
      if (!imgRes.ok) { newCovers.push(cover); continue }

      const blob = await put(`portada/${filename}`, imgRes.body!, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        token,
      })
      newCovers.push(blob.url)
      migrated++
    } catch {
      newCovers.push(cover) // keep original on error
    }
  }

  // ── Migrate gallery photos ────────────────────────────────────────────────
  const newPhotos = []
  for (const photo of data.photos) {
    if (!photo.file.startsWith('/photos/')) {
      newPhotos.push(photo) // already a blob URL
      continue
    }
    try {
      const filename = photo.file.split('/').pop()!
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
      const imgRes = await fetch(`${baseUrl}${photo.file}`)
      if (!imgRes.ok) { newPhotos.push(photo); continue }

      const blob = await put(`portfolio/${filename}`, imgRes.body!, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        token,
      })
      newPhotos.push({ ...photo, file: blob.url })
      migrated++
    } catch {
      newPhotos.push(photo) // keep original on error
    }
  }

  await saveData({ ...data, covers: newCovers, photos: newPhotos })
  return NextResponse.json({ ok: true, migrated })
}
