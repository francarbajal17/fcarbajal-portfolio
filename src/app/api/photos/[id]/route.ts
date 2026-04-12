import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'
import { GridFSBucket, ObjectId } from 'mongodb'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const doc = await db.collection('images').findOne({ _id: new ObjectId(params.id) })

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete file from GridFS if it was uploaded there
  if (doc.gridfsId) {
    const bucket = new GridFSBucket(db, { bucketName: 'photos' })
    await bucket.delete(new ObjectId(doc.gridfsId)).catch(() => {})
  }

  await db.collection('images').deleteOne({ _id: new ObjectId(params.id) })

  return NextResponse.json({ ok: true })
}
