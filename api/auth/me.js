const { getSql } = require('../../lib/db');
const { getSessionFromRequest, isAdminEmail } = require('../../lib/auth');

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
  const [user] = await sql`SELECT id, first_name, last_name, email FROM users WHERE id = ${session.sub}`;

  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.status(200).json({
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      isAdmin: isAdminEmail(user.email),
    },
  });
};
