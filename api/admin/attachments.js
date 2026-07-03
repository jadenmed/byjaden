const { put, del } = require('@vercel/blob');
const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');
const { logActivity } = require('../../lib/activity');

const MAX_SIZE_BYTES = 4 * 1024 * 1024;

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();

  if (req.method === 'POST') {
    const { projectId, filename, fileBase64 } = req.body || {};
    if (!projectId || !filename || !fileBase64) {
      res.status(400).json({ error: 'projectId, filename and fileBase64 are required' });
      return;
    }
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > MAX_SIZE_BYTES) {
      res.status(400).json({ error: 'File must be under 4MB' });
      return;
    }
    const blob = await put(`projects/${projectId}/${Date.now()}-${filename}`, buffer, { access: 'public' });
    const [attachment] = await sql`
      INSERT INTO attachments (project_id, filename, url, size_bytes)
      VALUES (${projectId}, ${filename}, ${blob.url}, ${buffer.length})
      RETURNING id, project_id, filename, url, size_bytes, created_at
    `;
    await logActivity(sql, 'attachment', attachment.id, 'created', `File uploaded: "${attachment.filename}"`);
    res.status(201).json({
      attachment: {
        id: attachment.id,
        projectId: attachment.project_id,
        filename: attachment.filename,
        url: attachment.url,
        sizeBytes: attachment.size_bytes,
        createdAt: attachment.created_at,
      },
    });
    return;
  }

  if (req.method === 'DELETE') {
    const { attachmentId } = req.body || {};
    if (!attachmentId) {
      res.status(400).json({ error: 'attachmentId is required' });
      return;
    }
    const [deleted] = await sql`DELETE FROM attachments WHERE id = ${attachmentId} RETURNING id, filename, url`;
    if (!deleted) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    await del(deleted.url).catch(() => {});
    await logActivity(sql, 'attachment', deleted.id, 'deleted', `File deleted: "${deleted.filename}"`);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
