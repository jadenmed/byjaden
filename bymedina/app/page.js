'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
}

function readingTime(text = '') {
  const words = text.replace(/[#*`>\-\[\]()]/g, '').split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200)) + ' min read'
}

function Sidebar() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <Link href="/" className="logo">
            by<span>medina</span>
          </Link>

          <p className="sidebar-headline">
            Design moves fast.<br />I make sense of it.
          </p>
          <p className="sidebar-subline">
            Weekly insights on design trends, tools, and visual culture — straight from the studio.
          </p>

          {status === 'success' ? (
            <p className="subscribe-success">
              You&rsquo;re in. See you next week.
            </p>
          ) : (
            <form className="subscribe-form" onSubmit={handleSubscribe}>
              <input
                className="subscribe-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button
                className="subscribe-btn"
                type="submit"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe — it\'s free'}
              </button>
            </form>
          )}

          <div className="sidebar-divider" />

          <p className="sidebar-bio">
            <strong>Jaden Medina</strong> is the CEO & Founder of{' '}
            <strong>Ocean Development</strong> — a studio that partners with
            ambitious founders to build brands that scale and last.
          </p>

          <div className="sidebar-social">
            <a href="https://twitter.com" target="_blank" rel="noopener">Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener">LinkedIn</a>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-footer-label">Built by</p>
        <p className="sidebar-footer-text">
          <strong>Ocean Development</strong><br />
          We partner with ambitious founders and teams to build brands that scale — and last.
        </p>
      </div>
    </aside>
  )
}

function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card-cover">
        <div
          className="blog-card-cover-inner"
          style={{ background: `linear-gradient(135deg, ${post.coverColor || '#c4a882'} 0%, ${post.coverColor ? post.coverColor + 'aa' : '#9b8b7a'} 100%)` }}
        />
        <span className="blog-card-category">{post.category || 'Design'}</span>
      </div>
      <div className="blog-card-body">
        <h2 className="blog-card-title">{post.title}</h2>
        <p className="blog-card-excerpt">{post.excerpt}</p>
        <div className="blog-card-meta">
          <span>{formatDate(post.createdAt)}</span>
          <span className="blog-card-meta-dot" />
          <span>{readingTime(post.content || post.excerpt)}</span>
          <span className="blog-card-read">Read &rarr;</span>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="site-wrapper">
      <Sidebar />
      <main className="main-scroll">
        <div className="blog-feed">
          <div className="feed-header">
            <p className="feed-title">Latest dispatches</p>
          </div>

          {loading ? (
            <div className="feed-empty">
              <p className="feed-empty-sub">Loading...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <p className="feed-empty-title">The first dispatch is loading.</p>
              <p className="feed-empty-sub">Check back soon — or subscribe to get it in your inbox.</p>
            </div>
          ) : (
            posts.map(post => <BlogCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </div>
  )
}
