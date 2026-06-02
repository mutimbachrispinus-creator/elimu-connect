import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getTransactionStatus } from '@/lib/pesapal'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderTrackingId  = searchParams.get('OrderTrackingId')
  const orderMerchantRef = searchParams.get('OrderMerchantReference')

  if (!orderTrackingId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-failed`)
  }

  try {
    const status = await getTransactionStatus(orderTrackingId)
    const snap   = await getDocs(query(collection(db,'payments'),where('reference','==',orderTrackingId)))

    if (!snap.empty) {
      const payDoc = snap.docs[0]
      const isPaid = status.payment_status_description === 'Completed'
      await updateDoc(doc(db,'payments',payDoc.id), {
        status:      isPaid ? 'completed' : 'failed',
        completedAt: isPaid ? new Date().toISOString() : undefined,
        metadata:    { ...payDoc.data().metadata, pesapalStatus: status.payment_status_description },
      })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`)
  } catch (err:any) {
    console.error('pesapal callback error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=failed`)
  }
}
