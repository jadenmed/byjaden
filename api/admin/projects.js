const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');
const { logActivity } = require('../../lib/activity');

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const projects = await sql`
      SELECT p.id, p.name, p.status, p.progress, p.created_at,
             u.id AS client_id, u.first_name, u.last_name, u.email
      FROM projects p
      JOIN users u ON u.id = p.client_id
      ORDER BY p.created_at DESC
    `;
    const projectIds = projects.map((p) => p.id);
    const updates = projectIds.length
      ? await sql`
          SELECT id, project_id, title, body, created_at FROM project_updates
          WHERE project_id = ANY(${projectIds})
          ORDER BY created_at DESC
        `
      : [];
    const attachments = projectIds.length
      ? await sql`
          SELECT id, project_id, filename, url, size_bytes, created_at FROM attachments
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
        client: { id: p.client_id, firstName: p.first_name, lastName: p.last_name, email: p.email },
        updates: updates
          .filter((u) => u.project_id === p.id)
          .map((u) => ({ id: u.id, title: u.title, body: u.body, createdAt: u.created_at })),
        attachments: attachments
          .filter((a) => a.project_id === p.id)
          .map((a) => ({ id: a.id, filename: a.filename, url: a.url, sizeBytes: a.size_bytes, createdAt: a.created_at })),
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
      RETURNING id, name, status, progress, created_at
    `;
    await logActivity(sql, 'project', project.id, 'created', `Project "${project.name}" created`);
    res.status(201).json({
      project: { id: project.id, name: project.name, status: project.status, progress: project.progress, createdAt: project.created_at },
    });
    return;
  }

  if (req.method === 'PATCH') {
    const { projectId, name, status, progress } = req.body || {};
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }
    if (progress != null && (Number.isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
      res.status(400).json({ error: 'progress must be a number between 0 and 100' });
      return;
    }
    const [existing] = await sql`SELECT id, name, status, progress FROM projects WHERE id = ${projectId}`;
    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const nextName = name && name.trim() ? name.trim() : existing.name;
    const nextStatus = status && status.trim() ? status.trim() : existing.status;
    const nextProgress = progress != null ? Number(progress) : existing.progress;
    const [project] = await sql`
      UPDATE projects SET name = ${nextName}, status = ${nextStatus}, progress = ${nextProgress}
      WHERE id = ${projectId}
      RETURNING id, name, status, progress, created_at
    `;
    const changes = [];
    if (nextName !== existing.name) changes.push(`renamed to "${nextName}"`);
    if (nextStatus !== existing.status) changes.push(`status set to ${nextStatus}`);
    if (nextProgress !== existing.progress) changes.push(`progress set to ${nextProgress}%`);
    if (changes.length) {
      await logActivity(sql, 'project', project.id, 'updated', `${project.name}: ${changes.join(', ')}`);
    }
    res.status(200).json({
      project: { id: project.id, name: project.name, status: project.status, progress: project.progress, createdAt: project.created_at },
    });
    return;
  }

  if (req.method === 'DELETE') {
    const { projectId } = req.body || {};
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }
    const [deleted] = await sql`DELETE FROM projects WHERE id = ${projectId} RETURNING id, name`;
    if (!deleted) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    await logActivity(sql, 'project', deleted.id, 'deleted', `Project "${deleted.name}" deleted`);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
