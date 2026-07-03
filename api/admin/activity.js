const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sql = getSql();
  const activity = await sql`
    SELECT id, entity_type, entity_id, action, detail, created_at
    FROM activity_log
    ORDER BY created_at DESC
    LIMIT 25
  `;

  res.status(200).json({
    activity: activity.map((a) => ({
      id: a.id,
      entityType: a.entity_type,
      entityId: a.entity_id,
      action: a.action,
      detail: a.detail,
      createdAt: a.created_at,
    })),
  });
};
