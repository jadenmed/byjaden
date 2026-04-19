import { NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/posts'

export async function POST(request) {
  const { email } = await request.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  await addSubscriber(email.toLowerCase().trim())
  return NextResponse.json({ success: true })
}
