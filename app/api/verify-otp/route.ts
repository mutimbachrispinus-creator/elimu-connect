import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { userId, type, otp } = await req.json()

    if (!userId || !type || !otp) {
      return NextResponse.json({ error: 'userId, type and otp are required' }, { status: 400 })
    }

    const snap = await getDoc(doc(db, 'otps', `${userId}_${type}`))
    if (!snap.exists()) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 })
    }

    const data = snap.data()

    if (Date.now() > data.expires) {
      await deleteDoc(doc(db, 'otps', `${userId}_${type}`))
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
    }

    if (data.otp !== otp.toString()) {
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    // Delete OTP after successful use
    await deleteDoc(doc(db, 'otps', `${userId}_${type}`))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: err.message ?? 'Verification failed' }, { status: 500 })
  }
}
