'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const CATEGORIES = ['Design', 'Typography', 'UX', 'Branding', 'Tools', 'Trends', 'Color', 'Motion']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// ---- LOGIN ----
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        onLogin()
      } else {
        setError('Wrong password. Try again.')
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <span className="admin-nav-logo">by<span>medina</span></span>
        <Link href="/" className="admin-nav-link">← View site</Link>
      </nav>
      <div className="login-wrap">
        <div className="login-box">
          <h1 className="login-title">Admin Studio</h1>
          <p className="login-sub">Enter your password to access the dashboard.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Unlocking...' : 'Enter dashboard'}
            </button>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  )
}

// ---- EDITOR ----
function Editor({ onPublish }) {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Design')
  const [publishing, setPublishing] = useState(false)
  const textareaRef = useRef(null)

  function insertMarkdown(before, after = '') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const newContent =
      content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) return
    setPublishing(true)
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, content, category })
      })
      if (res.ok) {
        setTitle('')
        setExcerpt('')
        setContent('')
        setCategory('Design')
        onPublish()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPublishing(false)
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="admin-editor">
      <h2 className="admin-section-title">New Post</h2>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          type="text"
          placeholder="This week in design..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          className="form-input"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Excerpt <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional — auto-generated if blank)</span></label>
        <input
          className="form-input"
          type="text"
          placeholder="A short teaser for the post list..."
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Content
          <span style={{ color: 'var(--text-light)', fontWeight: 400, marginLeft: 8 }}>
            — Markdown supported
          </span>
        </label>
        <div className="editor-toolbar">
          <button className="toolbar-btn" onClick={() => insertMarkdown('## ')}>H2</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('### ')}>H3</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('**', '**')}>Bold</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('*', '*')}>Italic</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('> ')}>Quote</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('- ')}>List</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('[', '](url)')}>Link</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('---\n')}>Divider</button>
        </div>
        <textarea
          ref={textareaRef}
          className="form-textarea"
          placeholder={`Start writing your dispatch...\n\nUse ## for headings, **bold**, *italic*, > for quotes.\n\nTip: Write like you're talking to a designer friend.`}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ minHeight: 320, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '0.875rem' }}
        />
        {wordCount > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 6 }}>
            {wordCount} words · ~{readTime} min read
          </p>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={handlePublish}
        disabled={publishing || !title.trim() || !content.trim()}
        style={{ marginTop: 8 }}
      >
        {publishing ? 'Publishing...' : 'Publish post →'}
      </button>
    </div>
  )
}

// ---- POSTS LIST ----
function PostsList({ posts, onDelete }) {
  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return
    const res = await fetch('/api/admin/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) onDelete()
  }

  if (posts.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          No posts yet.
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: 6 }}>
          Write your first dispatch on the left.
        </p>
      </div>
    )
  }

  return (
    <div>
      {posts.map(post => (
        <div key={post.id} className="post-list-item">
          <div style={{ flex: 1 }}>
            <p className="post-list-title">{post.title}</p>
            <p className="post-list-meta">
              {post.category} · {formatDate(post.createdAt)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener"
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
            >
              View
            </a>
            <button
              className="btn-danger"
              onClick={() => handleDelete(post.id, post.title)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- SUBSCRIBERS ----
function Subscribers() {
  const [subs, setSubs] = useState(null)

  useEffect(() => {
    fetch('/api/admin/posts?type=subscribers')
      .then(r => r.json())
      .then(data => setSubs(data))
      .catch(() => setSubs([]))
  }, [])

  if (subs === null) return <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Loading...</p>

  return (
    <div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        {subs.length} subscriber{subs.length !== 1 ? 's' : ''}
      </p>
      {subs.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>No subscribers yet. Share the site!</p>
      ) : (
        <div className="subscribers-list">
          {subs.map(email => <div key={email}>{email}</div>)}
        </div>
      )}
    </div>
  )
}

// ---- DASHBOARD ----
function Dashboard({ onLogout }) {
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [toast, setToast] = useState('')

  function loadPosts() {
    fetch('/api/admin/posts')
      .then(r => r.json())
      .then(setPosts)
      .catch(console.error)
  }

  useEffect(() => { loadPosts() }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handlePublished() {
    loadPosts()
    showToast('Post published successfully!')
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    onLogout()
  }

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <span className="admin-nav-logo">by<span>medina</span> <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: 400, letterSpacing: '0.05em' }}>ADMIN</span></span>
        <div className="admin-nav-right">
          <Link href="/" className="admin-nav-link" target="_blank">View site →</Link>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="admin-body">
        {/* LEFT: EDITOR */}
        <Editor onPublish={handlePublished} />

        {/* RIGHT: POSTS + SUBSCRIBERS */}
        <div className="admin-posts">
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts ({posts.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'subscribers' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscribers')}
            >
              Subscribers
            </button>
          </div>

          {activeTab === 'posts' && (
            <PostsList posts={posts} onDelete={loadPosts} />
          )}
          {activeTab === 'subscribers' && (
            <Subscribers />
          )}
        </div>
      </div>

      {toast && (
        <div className="success-toast">{toast}</div>
      )}
    </div>
  )
}

// ---- ROOT ----
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(null) // null = checking

  // Check session on load
  useEffect(() => {
    fetch('/api/admin/posts')
      .then(r => {
        setLoggedIn(r.status !== 401)
      })
      .catch(() => setLoggedIn(false))
  }, [])

  if (loggedIn === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Loading...</p>
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />
  }

  return <Dashboard onLogout={() => setLoggedIn(false)} />
}
