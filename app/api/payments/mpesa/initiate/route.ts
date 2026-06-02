import { NextRequest, NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { initiateStkPush, formatMpesaPhone } from '@/lib/mpesa'
import { buildRef } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, accountRef, description, userId, type, tier, courseId, sessionId, resourceId } = await req.json()

    if (!phone || !amount || !userId) {
      return NextResponse.json({ error: 'phone, amount and userId are required' }, { status: 400 })
    }

    const formattedPhone = formatMpesaPhone(phone)
    const paymentRef     = buildRef('MPE')

    // Initiate STK Push
    const stkRes = await initiateStkPush({
      phone:       formattedPhone,
      amount:      Number(amount),
      accountRef:  accountRef ?? paymentRef,
      description: description ?? 'ElimuConnect Payment',
    })

    if (stkRes.ResponseCode !== '0') {
      return NextResponse.json({ error: stkRes.ResponseDescription }, { status: 400 })
    }

    // Save payment record (pending)
    await setDoc(doc(db, 'payments', paymentRef), {
      id:          paymentRef,
      userId,
      type:        type ?? 'subscription',
      amount:      Number(amount),
      currency:    'KES',
      method:      'mpesa',
      status:      'pending',
      reference:   stkRes.CheckoutRequestID,
      phoneNumber: formattedPhone,
      metadata:    { tier, courseId, sessionId, resourceId, merchantRequestId: stkRes.MerchantRequestID },
      createdAt:   new Date().toISOString(),
    })

    return NextResponse.json({
      success:          true,
      checkoutRequestId: stkRes.CheckoutRequestID,
      paymentRef,
      customerMessage:  stkRes.CustomerMessage,
    })
  } catch (err: any) {
    console.error('mpesa initiate error:', err)
    return NextResponse.json({ error: err.message ?? 'Payment initiation failed' }, { status: 500 })
  }
}
