import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug } from '@/lib/posts'
import { marked } from 'marked'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: `${post.title} — bymedina`,
    description: post.excerpt,
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
}

function readingTime(text = '') {
  const words = text.replace(/[#*`>\-\[\]()]/g, '').split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200)) + ' min read'
}

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const htmlContent = marked(post.content || '')

  return (
    <div className="post-page">
      <nav className="post-nav">
        <Link href="/" className="post-nav-back">
          ← Back
        </Link>
        <Link href="/" className="post-nav-logo">
          by<span>medina</span>
        </Link>
        <div style={{ width: 60 }} />
      </nav>

      <div
        className="post-cover"
        style={{
          background: `linear-gradient(135deg, ${post.coverColor || '#c4a882'} 0%, ${post.coverColor ? post.coverColor + 'bb' : '#9b8b7a'} 100%)`
        }}
      />

      <div className="post-content-wrap">
        <span className="post-category-tag">{post.category || 'Design'}</span>
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          <span>Jaden Medina</span>
          <span className="post-meta-dot" />
          <span>{formatDate(post.createdAt)}</span>
          <span className="post-meta-dot" />
          <span>{readingTime(post.content)}</span>
        </div>
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}
