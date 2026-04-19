import { NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/posts'

export async function GET() {
  const posts = await getAllPosts()
  // Strip full content for listing (return excerpt only)
  const listing = posts.map(({ content, ...rest }) => rest)
  return NextResponse.json(listing)
}
