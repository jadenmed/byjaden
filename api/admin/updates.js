const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { projectId, title, body } = req.body || {};
  if (!projectId || !title || !title.trim()) {
    res.status(400).json({ error: 'projectId and title are required' });
    return;
  }

  const sql = getSql();
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
};
