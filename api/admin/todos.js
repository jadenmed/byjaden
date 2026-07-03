const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');
const { logActivity } = require('../../lib/activity');

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const todos = await sql`
      SELECT t.id, t.title, t.priority, t.done, t.due_date, t.visible_to_client, t.created_at,
             t.project_id, p.name AS project_name
      FROM todos t
      LEFT JOIN projects p ON p.id = t.project_id
    `;
    todos.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });
    res.status(200).json({
      todos: todos.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        done: t.done,
        dueDate: t.due_date,
        visibleToClient: t.visible_to_client,
        createdAt: t.created_at,
        projectId: t.project_id,
        projectName: t.project_name,
      })),
    });
    return;
  }

  if (req.method === 'POST') {
    const { title, priority, dueDate, projectId, visibleToClient } = req.body || {};
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const nextPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';
    const [todo] = await sql`
      INSERT INTO todos (title, priority, due_date, project_id, visible_to_client)
      VALUES (${title.trim()}, ${nextPriority}, ${dueDate || null}, ${projectId || null}, ${Boolean(visibleToClient)})
      RETURNING id, title, priority, done, due_date, visible_to_client, created_at, project_id
    `;
    await logActivity(sql, 'todo', todo.id, 'created', `To-do created: "${todo.title}"`);
    res.status(201).json({
      todo: {
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
        done: todo.done,
        dueDate: todo.due_date,
        visibleToClient: todo.visible_to_client,
        createdAt: todo.created_at,
        projectId: todo.project_id,
      },
    });
    return;
  }

  if (req.method === 'PATCH') {
    const { todoId, title, priority, done, dueDate, projectId, visibleToClient } = req.body || {};
    if (!todoId) {
      res.status(400).json({ error: 'todoId is required' });
      return;
    }
    const [existing] = await sql`SELECT id, title, priority, done, due_date, project_id, visible_to_client FROM todos WHERE id = ${todoId}`;
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    const nextTitle = title && title.trim() ? title.trim() : existing.title;
    const nextPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : existing.priority;
    const nextDone = done != null ? Boolean(done) : existing.done;
    const nextDueDate = dueDate !== undefined ? (dueDate || null) : existing.due_date;
    const nextProjectId = projectId !== undefined ? (projectId || null) : existing.project_id;
    const nextVisible = visibleToClient != null ? Boolean(visibleToClient) : existing.visible_to_client;
    const [todo] = await sql`
      UPDATE todos
      SET title = ${nextTitle}, priority = ${nextPriority}, done = ${nextDone},
          due_date = ${nextDueDate}, project_id = ${nextProjectId}, visible_to_client = ${nextVisible}
      WHERE id = ${todoId}
      RETURNING id, title, priority, done, due_date, visible_to_client, created_at, project_id
    `;
    if (nextDone !== existing.done) {
      await logActivity(sql, 'todo', todo.id, nextDone ? 'completed' : 'reopened', `"${todo.title}" ${nextDone ? 'marked done' : 'reopened'}`);
    }
    res.status(200).json({
      todo: {
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
        done: todo.done,
        dueDate: todo.due_date,
        visibleToClient: todo.visible_to_client,
        createdAt: todo.created_at,
        projectId: todo.project_id,
      },
    });
    return;
  }

  if (req.method === 'DELETE') {
    const { todoId } = req.body || {};
    if (!todoId) {
      res.status(400).json({ error: 'todoId is required' });
      return;
    }
    const [deleted] = await sql`DELETE FROM todos WHERE id = ${todoId} RETURNING id, title`;
    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    await logActivity(sql, 'todo', deleted.id, 'deleted', `To-do deleted: "${deleted.title}"`);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
