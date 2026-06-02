// Africa's Talking SMS – Phone OTP
const AT_API_KEY  = process.env.AT_API_KEY ?? ''
const AT_USERNAME = process.env.AT_USERNAME ?? 'sandbox'
const AT_SENDER   = process.env.AT_SENDER_ID ?? 'ElimuConnect'

const BASE_URL = AT_USERNAME === 'sandbox'
  ? 'https://api.sandbox.africastalking.com/version1/messaging'
  : 'https://api.africastalking.com/version1/messaging'

export async function sendSMSOTP(phone: string, otp: string, name: string) {
  const message = `Hello ${name}, your ElimuConnect verification code is: ${otp}. Valid for 10 minutes. Do not share.`

  const params = new URLSearchParams({
    username: AT_USERNAME,
    to:       phone,
    message,
    from:     AT_SENDER,
  })

  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Accept:        'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      apiKey:        AT_API_KEY,
    },
    body: params.toString(),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`AT SMS error: ${text}`)
  }

  return resp.json()
}
