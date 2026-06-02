import { NextRequest, NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sendEmailOTP } from '@/lib/resend'
import { sendSMSOTP } from '@/lib/africas-talking'
import { generateOTP } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { type, email, phone, name, userId } = await req.json()

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const otp     = generateOTP(6)
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP in Firestore
    const otpKey = type === 'email' ? 'email_otp' : 'phone_otp'
    await setDoc(doc(db, 'otps', `${userId}_${type}`), {
      userId, type, otp, expires, createdAt: new Date().toISOString(),
    })

    if (type === 'email') {
      if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
      await sendEmailOTP(email, otp, name ?? 'User')
    } else {
      if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })
      await sendSMSOTP(phone, otp, name ?? 'User')
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to send OTP' }, { status: 500 })
  }
}
