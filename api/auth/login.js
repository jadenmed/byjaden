const bcrypt = require('bcryptjs');
const { getSql } = require('../../lib/db');
const { signSession, setSessionCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const sql = getSql();

  const [user] = await sql`SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ${normalizedEmail}`;

  // Generic error on purpose — don't reveal whether the email exists.
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signSession(user);
  setSessionCookie(res, token);

  res.status(200).json({
    user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email },
  });
};
