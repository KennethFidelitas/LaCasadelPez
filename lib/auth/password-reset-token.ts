import { createHmac, timingSafeEqual } from 'crypto'

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000

type ResetTokenPayload = {
  sub: string
  email: string
  exp: number
  purpose: 'password-reset'
}

function getResetSecret() {
  const secret =
    process.env.PASSWORD_RESET_SECRET ||
    process.env.INTERNAL_EMAIL_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error('PASSWORD_RESET_SECRET no está configurado.')
  }

  return secret
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(payload: string) {
  return createHmac('sha256', getResetSecret()).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  return left.length === right.length && timingSafeEqual(left, right)
}

export function createPasswordResetToken(params: { userId: string; email: string }) {
  const payload: ResetTokenPayload = {
    sub: params.userId,
    email: params.email,
    exp: Date.now() + RESET_TOKEN_TTL_MS,
    purpose: 'password-reset',
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function verifyPasswordResetToken(token: string): ResetTokenPayload | null {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)

  if (!safeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as ResetTokenPayload

    if (payload.purpose !== 'password-reset') return null
    if (!payload.sub || !payload.email || Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}
