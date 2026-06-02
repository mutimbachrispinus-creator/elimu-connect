// Pesapal v3 API Integration
const CONSUMER_KEY    = process.env.PESAPAL_CONSUMER_KEY ?? ''
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET ?? ''
const CALLBACK_URL    = process.env.PESAPAL_CALLBACK_URL ?? ''
const IS_SANDBOX      = (process.env.PESAPAL_ENV ?? 'sandbox') === 'sandbox'

const BASE_URL = IS_SANDBOX
  ? 'https://cybqa.pesapal.com/pesapalv3'
  : 'https://pay.pesapal.com/v3'

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function getToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET }),
  })
  if (!res.ok) throw new Error('Pesapal auth failed')
  const data = await res.json() as { token: string }
  return data.token
}

// ─── Register IPN ─────────────────────────────────────────────────────────────
export async function registerIPN() {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url:            CALLBACK_URL,
      ipn_notification_type: 'GET',
    }),
  })
  return res.json()
}

// ─── Submit Order ─────────────────────────────────────────────────────────────
export interface PesapalOrderParams {
  id: string           // unique order id
  amount: number       // KES
  currency?: string
  description: string
  callbackUrl: string
  notificationId: string
  billingEmail: string
  billingPhone: string
  billingFirstName: string
  billingLastName: string
}

export async function submitOrder(params: PesapalOrderParams) {
  const token = await getToken()
  const body = {
    id:              params.id,
    currency:        params.currency ?? 'KES',
    amount:          params.amount,
    description:     params.description,
    callback_url:    params.callbackUrl,
    notification_id: params.notificationId,
    billing_address: {
      email_address: params.billingEmail,
      phone_number:  params.billingPhone,
      first_name:    params.billingFirstName,
      last_name:     params.billingLastName,
    },
  }

  const res = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pesapal order failed: ${err}`)
  }

  return res.json() as Promise<{ order_tracking_id: string; redirect_url: string; status: string }>
}

// ─── Get Transaction Status ───────────────────────────────────────────────────
export async function getTransactionStatus(orderTrackingId: string) {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  return res.json()
}
