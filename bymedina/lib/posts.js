// Storage layer: Vercel KV in production, in-memory fallback for dev
let kv = null

async function getKV() {
  if (kv) return kv
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null
  }
  try {
    const mod = await import('@vercel/kv')
    kv = mod.kv
    return kv
  } catch {
    return null
  }
}

// In-memory fallback
const memPosts = new Map()
const memSubs = new Set()

// --- POSTS ---

export async function getAllPosts() {
  const store = await getKV()
  if (store) {
    try {
      const ids = await store.lrange('post_ids', 0, -1)
      if (!ids || ids.length === 0) return []
      const posts = await Promise.all(ids.map(id => store.hgetall(`post:${id}`)))
      return posts
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (e) {
      console.error('KV error:', e)
    }
  }
  return Array.from(memPosts.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getPostBySlug(slug) {
  const store = await getKV()
  if (store) {
    try {
      const id = await store.get(`slug:${slug}`)
      if (!id) return null
      return await store.hgetall(`post:${id}`)
    } catch (e) {
      console.error('KV error:', e)
    }
  }
  return Array.from(memPosts.values()).find(p => p.slug === slug) || null
}

export async function createPost({ id, title, slug, excerpt, content, category, coverColor, createdAt }) {
  const post = { id, title, slug, excerpt, content, category, coverColor, createdAt }
  const store = await getKV()
  if (store) {
    try {
      await store.hset(`post:${id}`, post)
      await store.lpush('post_ids', id)
      await store.set(`slug:${slug}`, id)
      return post
    } catch (e) {
      console.error('KV error:', e)
    }
  }
  memPosts.set(id, post)
  return post
}

export async function deletePost(id) {
  const store = await getKV()
  if (store) {
    try {
      const post = await store.hgetall(`post:${id}`)
      if (post) {
        await store.del(`post:${id}`)
        await store.del(`slug:${post.slug}`)
        await store.lrem('post_ids', 0, id)
      }
      return
    } catch (e) {
      console.error('KV error:', e)
    }
  }
  memPosts.delete(id)
}

// --- SUBSCRIBERS ---

export async function addSubscriber(email) {
  const store = await getKV()
  if (store) {
    try {
      await store.sadd('subscribers', email)
      return
    } catch (e) {
      console.error('KV error:', e)
    }
  }
  memSubs.add(email)
}

export async function getSubscribers() {
  const store = await getKV()
  if (store) {
    try {
      return await store.smembers('subscribers')
    } catch (e) {
      console.error('KV error:', e)
    }
  }
  return Array.from(memSubs)
}
