// Safaricom M-Pesa Daraja API – STK Push (Lipa Na M-Pesa Online)
const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY ?? ''
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? ''
const SHORTCODE       = process.env.MPESA_SHORTCODE ?? '174379'
const PASSKEY         = process.env.MPESA_PASSKEY ?? ''
const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL ?? ''
const IS_SANDBOX      = (process.env.MPESA_ENV ?? 'sandbox') === 'sandbox'

const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke'

// ─── Auth token ───────────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) throw new Error('Failed to get M-Pesa access token')
  const data = await res.json() as { access_token: string }
  return data.access_token
}

// ─── STK Push ─────────────────────────────────────────────────────────────────
export interface STKPushParams {
  phone: string       // 254XXXXXXXXX format
  amount: number      // KES
  accountRef: string  // e.g. 'INV-001'
  description: string // e.g. 'ElimuConnect Subscription'
}

export interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export async function initiateStkPush(params: STKPushParams): Promise<STKPushResponse> {
  const token    = await getAccessToken()
  const now      = new Date()
  const timestamp = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

  const body = {
    BusinessShortCode: SHORTCODE,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            Math.ceil(params.amount),
    PartyA:            params.phone,
    PartyB:            SHORTCODE,
    PhoneNumber:       params.phone,
    CallBackURL:       CALLBACK_URL,
    AccountReference:  params.accountRef.slice(0, 12),
    TransactionDesc:   params.description.slice(0, 13),
  }

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`STK Push failed: ${err}`)
  }

  return res.json() as Promise<STKPushResponse>
}

// ─── Query STK Push status ────────────────────────────────────────────────────
export async function queryStkPush(checkoutRequestId: string) {
  const token    = await getAccessToken()
  const now      = new Date()
  const timestamp = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      BusinessShortCode: SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  })

  return res.json()
}

// ─── Format phone for Daraja (254 format) ────────────────────────────────────
export function formatMpesaPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0'))   return `254${cleaned.slice(1)}`
  if (cleaned.startsWith('254')) return cleaned
  if (cleaned.startsWith('+'))   return cleaned.slice(1)
  return cleaned
}
