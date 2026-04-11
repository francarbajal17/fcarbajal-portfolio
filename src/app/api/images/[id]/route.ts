import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { GridFSBucket, ObjectId } from 'mongodb'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let fileId: ObjectId
  try {
    fileId = new ObjectId(params.id)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const db = await getDb()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })

  const files = await bucket.find({ _id: fileId }).toArray()
  if (files.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const file = files[0]
  const chunks: Buffer[] = []

  await new Promise<void>((resolve, reject) => {
    const stream = bucket.openDownloadStream(fileId)
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', resolve)
    stream.on('error', reject)
  })

  const data = Buffer.concat(chunks)

  return new NextResponse(data, {
    headers: {
      'Content-Type': file.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
