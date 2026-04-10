import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { social } = await req.json()
  const db = await getDb()

  await db.collection('settings').updateOne(
    { _id: 'main' as any },
    { $set: { social } },
    { upsert: true }
  )

  return NextResponse.json({ ok: true })
}
