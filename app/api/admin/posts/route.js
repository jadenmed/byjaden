import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getAllPosts, createPost, deletePost, getSubscribers } from '@/lib/posts'
import { v4 as uuidv4 } from 'uuid'

const COVER_COLORS = [
  '#c4a882', '#9b8b7a', '#b5a090', '#8b7355',
  '#a89080', '#c8b09a', '#7a6855', '#b09878'
]

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request) {
  const auth = await isAdminAuthenticated()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  if (searchParams.get('type') === 'subscribers') {
    const subs = await getSubscribers()
    return NextResponse.json(subs)
  }

  const posts = await getAllPosts()
  return NextResponse.json(posts)
}

export async function POST(request) {
  const auth = await isAdminAuthenticated()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, excerpt, content, category } = await request.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const id = uuidv4()
  const slug = slugify(title) + '-' + id.slice(0, 6)
  const coverColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]
  const createdAt = new Date().toISOString()

  const post = await createPost({
    id,
    title,
    slug,
    excerpt: excerpt || content.slice(0, 160).replace(/[#*`]/g, '') + '...',
    content,
    category: category || 'Design',
    coverColor,
    createdAt
  })

  return NextResponse.json(post)
}

export async function DELETE(request) {
  const auth = await isAdminAuthenticated()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await deletePost(id)
  return NextResponse.json({ success: true })
}
