import { Resend } from 'resend'

let resend: Resend | null = null

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is required to send email')
  resend ??= new Resend(apiKey)
  return resend
}

const FROM = `${process.env.RESEND_FROM_NAME ?? 'ElimuConnect'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@elimuconnect.co.ke'}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://elimuconnect.co.ke'

// ─── OTP Email ───────────────────────────────────────────────────────────────
export async function sendEmailOTP(to: string, otp: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${otp} – Your ElimuConnect Verification Code`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,#166534 0%,#22c55e 100%);padding:32px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px">ElimuConnect</h1>
          <p style="color:#bbf7d0;margin:6px 0 0;font-size:14px">Kenya's Premier Learning Hub</p>
        </div>
        <div style="padding:40px">
          <p style="font-size:18px;color:#166534;font-weight:600">Hello ${name},</p>
          <p style="color:#374151;line-height:1.6">Enter the code below to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#166534;background:#f0fdf4;padding:16px 32px;border-radius:12px;border:2px dashed #86efac">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:13px">If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6">
          <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} ElimuConnect. Connecting Learners to Excellence.</p>
        </div>
      </div>
    `,
  })
}

// ─── Welcome Email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const dashboardUrl = `${APP_URL}/dashboard`
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Welcome to ElimuConnect, ${name}! 🎓`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,#166534 0%,#22c55e 100%);padding:32px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">ElimuConnect</h1>
          <p style="color:#bbf7d0;margin:6px 0 0;font-size:14px">Kenya's Premier Learning Hub</p>
        </div>
        <div style="padding:40px">
          <p style="font-size:18px;color:#166534;font-weight:600">Karibu, ${name}! 🎉</p>
          <p style="color:#374151;line-height:1.6">Your <strong>${role}</strong> account has been successfully created. You are now part of Kenya's fastest-growing education community.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${dashboardUrl}" style="background:#166534;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Go to Dashboard →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6">
          <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} ElimuConnect</p>
        </div>
      </div>
    `,
  })
}

// ─── Booking Notification ─────────────────────────────────────────────────────
export async function sendBookingNotification(opts: {
  to: string; toName: string; fromName: string; subject: string; message: string
}) {
  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `New Booking Request from ${opts.fromName} – ElimuConnect`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto">
        <div style="background:#166534;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">New Booking Request</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="color:#166534;font-weight:600;font-size:16px">Hello ${opts.toName},</p>
          <p style="color:#374151"><strong>${opts.fromName}</strong> has sent you a booking request for <strong>${opts.subject}</strong>.</p>
          <blockquote style="border-left:4px solid #22c55e;margin:16px 0;padding:12px 16px;background:#f0fdf4;color:#374151">${opts.message}</blockquote>
          <a href="${APP_URL}/dashboard/teacher/bookings" style="display:inline-block;background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Request →</a>
        </div>
      </div>
    `,
  })
}

export default getResend
