const { getSql } = require('../lib/db');
const { getSessionFromRequest } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const sql = getSql();

  const projects = await sql`
    SELECT id, name, status, progress, created_at FROM projects
    WHERE client_id = ${session.sub}
    ORDER BY created_at DESC
  `;

  const projectIds = projects.map((p) => p.id);
  const updates = projectIds.length
    ? await sql`
        SELECT id, project_id, title, body, created_at FROM project_updates
        WHERE project_id = ANY(${projectIds})
        ORDER BY created_at DESC
      `
    : [];

  res.status(200).json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      createdAt: p.created_at,
      updates: updates
        .filter((u) => u.project_id === p.id)
        .map((u) => ({ id: u.id, title: u.title, body: u.body, createdAt: u.created_at })),
    })),
  });
};
