import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { query } from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }
  const r = await query(
    'SELECT id, email, password_hash, role, name, cargo, departamento FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  );
  const user = r.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  delete user.password_hash;
  res.json({ token, user });
});

router.post('/register', async (req, res) => {
  const { email, password, role, name, cargo, departamento } = req.body || {};
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Email, senha, role e nome obrigatórios' });
  }
  if (!['gestor', 'funcionario'].includes(role)) {
    return res.status(400).json({ error: 'Role deve ser gestor ou funcionario' });
  }
  const id = nanoid(10);
  const password_hash = await bcrypt.hash(password, 10);
  const emailNorm = email.trim().toLowerCase();
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, role, name, cargo, departamento)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, emailNorm, password_hash, role, (name || '').trim(), (cargo || '').trim(), (departamento || '').trim()]
    );
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }
    throw e;
  }
  const r = await query(
    'SELECT id, email, role, name, cargo, departamento FROM users WHERE id = $1',
    [id]
  );
  const user = r.rows[0];
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({ token, user });
});

export default router;
