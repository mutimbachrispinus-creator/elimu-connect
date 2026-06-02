import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a numeric OTP of the given length */
export function generateOTP(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

/** Format KES currency */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', minimumFractionDigits: 0,
  }).format(amount)
}

/** Format duration in seconds to human-readable */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

/** Stars rating render helper */
export function ratingStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/** Sleep helper */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Build referral/payment reference */
export function buildRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

/** Curriculum badge color */
export function curriculumColor(c: string): string {
  const map: Record<string, string> = {
    CBC:        'bg-green-100 text-green-800',
    '8-4-4':    'bg-blue-100 text-blue-800',
    Cambridge:  'bg-purple-100 text-purple-800',
    IB:         'bg-amber-100 text-amber-800',
    Montessori: 'bg-rose-100 text-rose-800',
    American:   'bg-cyan-100 text-cyan-800',
    French:     'bg-indigo-100 text-indigo-800',
    GCSE:       'bg-violet-100 text-violet-800',
    BTEC:       'bg-orange-100 text-orange-800',
  }
  return map[c] ?? 'bg-gray-100 text-gray-800'
}
