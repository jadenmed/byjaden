const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const projects = await sql`
      SELECT p.id, p.name, p.status, p.created_at,
             u.id AS client_id, u.first_name, u.last_name, u.email
      FROM projects p
      JOIN users u ON u.id = p.client_id
      ORDER BY p.created_at DESC
    `;
    res.status(200).json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        createdAt: p.created_at,
        client: { id: p.client_id, firstName: p.first_name, lastName: p.last_name, email: p.email },
      })),
    });
    return;
  }

  if (req.method === 'POST') {
    const { clientId, name, status } = req.body || {};
    if (!clientId || !name || !name.trim()) {
      res.status(400).json({ error: 'clientId and name are required' });
      return;
    }
    const [project] = await sql`
      INSERT INTO projects (client_id, name, status)
      VALUES (${clientId}, ${name.trim()}, ${status && status.trim() ? status.trim() : 'In Progress'})
      RETURNING id, name, status, created_at
    `;
    res.status(201).json({
      project: { id: project.id, name: project.name, status: project.status, createdAt: project.created_at },
    });
    return;
  }

  if (req.method === 'PATCH') {
    const { projectId, status } = req.body || {};
    if (!projectId || !status || !status.trim()) {
      res.status(400).json({ error: 'projectId and status are required' });
      return;
    }
    const [project] = await sql`
      UPDATE projects SET status = ${status.trim()} WHERE id = ${projectId}
      RETURNING id, name, status, created_at
    `;
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.status(200).json({
      project: { id: project.id, name: project.name, status: project.status, createdAt: project.created_at },
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
