import { cookies } from 'next/headers'

const SESSION_COOKIE = 'bm_session'
const SESSION_SECRET = 'bymedina_admin_2024'

export function generateToken() {
  const payload = `${SESSION_SECRET}:${Date.now()}`
  return Buffer.from(payload).toString('base64')
}

export function isValidToken(token) {
  if (!token) return false
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    return decoded.startsWith(`${SESSION_SECRET}:`)
  } catch {
    return false
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return isValidToken(token)
}

export function setAdminCookie(response, token) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

export function clearAdminCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/'
  })
}
