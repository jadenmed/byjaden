const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'session';
const SESSION_DAYS = 7;

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }
  return process.env.AUTH_SECRET;
}

function signSession(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    getSecret(),
    { expiresIn: `${SESSION_DAYS}d` }
  );
}

function verifySession(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

module.exports = {
  signSession,
  verifySession,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
};
