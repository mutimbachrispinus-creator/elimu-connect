import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const runtime = 'edge'

// Safaricom sends this after STK Push completes / fails
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cb   = body?.Body?.stkCallback

    if (!cb) return NextResponse.json({ ResultCode: 0, ResultDesc: 'OK' })

    const checkoutRequestId = cb.CheckoutRequestID
    const resultCode        = cb.ResultCode   // 0 = success
    const resultDesc        = cb.ResultDesc

    // Find payment by reference
    const snap = await getDocs(query(
      collection(db,'payments'),
      where('reference','==',checkoutRequestId)
    ))

    if (snap.empty) {
      console.warn('mpesa callback: no payment found for', checkoutRequestId)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'OK' })
    }

    const payDoc = snap.docs[0]
    const payRef = doc(db, 'payments', payDoc.id)

    if (resultCode === 0) {
      // Extract M-Pesa receipt number
      const items: any[] = cb.CallbackMetadata?.Item ?? []
      const receipt = items.find(i=>i.Name==='MpesaReceiptNumber')?.Value ?? ''
      const amount  = items.find(i=>i.Name==='Amount')?.Value ?? 0

      await updateDoc(payRef, {
        status:      'completed',
        completedAt: new Date().toISOString(),
        metadata:    { ...payDoc.data().metadata, mpesaReceipt: receipt, confirmedAmount: amount },
      })

      // Handle post-payment actions
      const payment = payDoc.data()
      if (payment.type === 'subscription' && payment.metadata?.tier) {
        const { tier } = payment.metadata
        const tierConfig: Record<string, { maxStudents:number; months:number }> = {
          basic:        { maxStudents:20,   months:1 },
          professional: { maxStudents:100,  months:1 },
          enterprise:   { maxStudents:9999, months:1 },
        }
        const cfg = tierConfig[tier] ?? tierConfig.basic
        const endDate = new Date(Date.now() + cfg.months * 30 * 86400000).toISOString()

        await updateDoc(doc(db,'teachers',payment.userId),{
          registrationFeePaid: true,
          'subscription.tier':              tier,
          'subscription.status':           'active',
          'subscription.startDate':        new Date().toISOString(),
          'subscription.endDate':          endDate,
          'subscription.maxStudents':      cfg.maxStudents,
          'subscription.canUploadVideos':  true,
          'subscription.canCreateCourses': true,
        })
      }
    } else {
      await updateDoc(payRef, { status: 'failed', metadata: { ...payDoc.data().metadata, failureReason: resultDesc } })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'OK' })
  } catch (err: any) {
    console.error('mpesa callback error:', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'OK' }) // Always return 0 to Safaricom
  }
}
