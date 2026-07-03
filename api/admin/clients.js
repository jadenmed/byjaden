const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSessionFromRequest(req);
  if (!session || !isAdminEmail(session.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const sql = getSql();
  const clients = await sql`
    SELECT id, first_name, last_name, email FROM users ORDER BY created_at DESC
  `;

  res.status(200).json({
    clients: clients.map((c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
    })),
  });
};
