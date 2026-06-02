import { NextRequest, NextResponse } from 'next/server'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { userId, type, title, message, actionUrl } = await req.json()
    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, title, message required' }, { status: 400 })
    }
    await addDoc(collection(db, 'notifications'), {
      userId, type: type ?? 'system',
      title, message, actionUrl: actionUrl ?? '',
      read: false,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
