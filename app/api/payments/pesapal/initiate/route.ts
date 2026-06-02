import { NextRequest, NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { submitOrder } from '@/lib/pesapal'
import { buildRef } from '@/lib/utils'

export const runtime = 'edge'

// POST /api/payments/pesapal/initiate
export async function POST(req: NextRequest) {
  try {
    const { userId, amount, description, email, phone, firstName, lastName, type, courseId } = await req.json()

    if (!userId || !amount || !email) {
      return NextResponse.json({ error: 'userId, amount and email required' }, { status: 400 })
    }

    const orderId = buildRef('PES')

    const result = await submitOrder({
      id:              orderId,
      amount:          Number(amount),
      currency:        'KES',
      description:     description ?? 'ElimuConnect Payment',
      callbackUrl:     `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/pesapal/callback`,
      notificationId:  process.env.PESAPAL_NOTIFICATION_ID ?? '',
      billingEmail:    email,
      billingPhone:    phone ?? '',
      billingFirstName: firstName ?? 'User',
      billingLastName:  lastName ?? '',
    })

    // Save payment record
    await setDoc(doc(db,'payments',orderId),{
      id: orderId, userId,
      type: type ?? 'subscription',
      amount: Number(amount), currency: 'KES',
      method: 'pesapal', status: 'pending',
      reference: result.order_tracking_id,
      metadata: { courseId },
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success:         true,
      redirectUrl:     result.redirect_url,
      orderTrackingId: result.order_tracking_id,
      orderId,
    })
  } catch (err: any) {
    console.error('pesapal initiate error:', err)
    return NextResponse.json({ error: err.message ?? 'Payment failed' }, { status: 500 })
  }
}
