import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  const r = await query(
    'SELECT id, email, role, name, cargo, departamento FROM users WHERE id = $1',
    [req.userId]
  );
  if (r.rows[0]) req.user = r.rows[0];
  next();
}
