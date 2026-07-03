const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const todos = await sql`SELECT id, title, priority, done, created_at FROM todos`;
    todos.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });
    res.status(200).json({
      todos: todos.map((t) => ({ id: t.id, title: t.title, priority: t.priority, done: t.done, createdAt: t.created_at })),
    });
    return;
  }

  if (req.method === 'POST') {
    const { title, priority } = req.body || {};
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const nextPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';
    const [todo] = await sql`
      INSERT INTO todos (title, priority)
      VALUES (${title.trim()}, ${nextPriority})
      RETURNING id, title, priority, done, created_at
    `;
    res.status(201).json({
      todo: { id: todo.id, title: todo.title, priority: todo.priority, done: todo.done, createdAt: todo.created_at },
    });
    return;
  }

  if (req.method === 'PATCH') {
    const { todoId, title, priority, done } = req.body || {};
    if (!todoId) {
      res.status(400).json({ error: 'todoId is required' });
      return;
    }
    const [existing] = await sql`SELECT id, title, priority, done FROM todos WHERE id = ${todoId}`;
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    const nextTitle = title && title.trim() ? title.trim() : existing.title;
    const nextPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : existing.priority;
    const nextDone = done != null ? Boolean(done) : existing.done;
    const [todo] = await sql`
      UPDATE todos SET title = ${nextTitle}, priority = ${nextPriority}, done = ${nextDone}
      WHERE id = ${todoId}
      RETURNING id, title, priority, done, created_at
    `;
    res.status(200).json({
      todo: { id: todo.id, title: todo.title, priority: todo.priority, done: todo.done, createdAt: todo.created_at },
    });
    return;
  }

  if (req.method === 'DELETE') {
    const { todoId } = req.body || {};
    if (!todoId) {
      res.status(400).json({ error: 'todoId is required' });
      return;
    }
    const [deleted] = await sql`DELETE FROM todos WHERE id = ${todoId} RETURNING id`;
    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
