import { NextResponse } from 'next/server'
import { generateToken, setAdminCookie } from '@/lib/auth'

export async function POST(request) {
  const { password } = await request.json()
  const adminPassword = process.env.ADMIN_PASSWORD || 'bymedina2024'

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = generateToken()
  const response = NextResponse.json({ success: true })
  setAdminCookie(response, token)
  return response
}
