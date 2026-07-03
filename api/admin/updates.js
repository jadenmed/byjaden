const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();

  if (req.method === 'POST') {
    const { projectId, title, body } = req.body || {};
    if (!projectId || !title || !title.trim()) {
      res.status(400).json({ error: 'projectId and title are required' });
      return;
    }
    const [update] = await sql`
      INSERT INTO project_updates (project_id, title, body)
      VALUES (${projectId}, ${title.trim()}, ${body && body.trim() ? body.trim() : null})
      RETURNING id, project_id, title, body, created_at
    `;
    res.status(201).json({
      update: {
        id: update.id,
        projectId: update.project_id,
        title: update.title,
        body: update.body,
        createdAt: update.created_at,
      },
    });
    return;
  }

  if (req.method === 'PATCH') {
    const { updateId, title, body } = req.body || {};
    if (!updateId || !title || !title.trim()) {
      res.status(400).json({ error: 'updateId and title are required' });
      return;
    }
    const [update] = await sql`
      UPDATE project_updates SET title = ${title.trim()}, body = ${body && body.trim() ? body.trim() : null}
      WHERE id = ${updateId}
      RETURNING id, project_id, title, body, created_at
    `;
    if (!update) {
      res.status(404).json({ error: 'Update not found' });
      return;
    }
    res.status(200).json({
      update: {
        id: update.id,
        projectId: update.project_id,
        title: update.title,
        body: update.body,
        createdAt: update.created_at,
      },
    });
    return;
  }

  if (req.method === 'DELETE') {
    const { updateId } = req.body || {};
    if (!updateId) {
      res.status(400).json({ error: 'updateId is required' });
      return;
    }
    const [deleted] = await sql`DELETE FROM project_updates WHERE id = ${updateId} RETURNING id`;
    if (!deleted) {
      res.status(404).json({ error: 'Update not found' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
