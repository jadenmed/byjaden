const bcrypt = require('bcryptjs');
const { getSql } = require('../../lib/db');
const { signSession, setSessionCookie } = require('../../lib/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { firstName, lastName, email, password } = req.body || {};

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const sql = getSql();

  const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
  if (existing.length > 0) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await sql`
    INSERT INTO users (first_name, last_name, email, password_hash)
    VALUES (${firstName.trim()}, ${lastName.trim()}, ${normalizedEmail}, ${passwordHash})
    RETURNING id, first_name, last_name, email
  `;

  const token = signSession(user);
  setSessionCookie(res, token);

  res.status(201).json({
    user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email },
  });
};
