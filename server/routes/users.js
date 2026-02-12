import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { query } from '../db.js';
import { requireAuth, requireRole, attachUser } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(attachUser);
router.use(requireRole('gestor'));

router.get('/', async (req, res) => {
  const r = await query(
    'SELECT id, email, role, name, cargo, departamento, created_at FROM users ORDER BY name'
  );
  res.json(r.rows);
});

router.get('/funcionarios', async (req, res) => {
  const r = await query(
    `SELECT id, email, role, name, cargo, departamento, created_at FROM users WHERE role = 'funcionario' ORDER BY name`
  );
  res.json(r.rows);
});

router.post('/', async (req, res) => {
  const { email, password, name, cargo, departamento } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome obrigatórios' });
  }
  const id = nanoid(10);
  const password_hash = await bcrypt.hash(password, 10);
  const emailNorm = email.trim().toLowerCase();
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, role, name, cargo, departamento)
       VALUES ($1, $2, $3, 'funcionario', $4, $5, $6)`,
      [id, emailNorm, password_hash, (name || '').trim(), (cargo || '').trim(), (departamento || '').trim()]
    );
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }
    throw e;
  }
  const r = await query(
    'SELECT id, email, role, name, cargo, departamento, created_at FROM users WHERE id = $1',
    [id]
  );
  res.status(201).json(r.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { email, password, name, cargo, departamento } = req.body || {};
  const updates = [];
  const params = [];
  let n = 1;
  if (email !== undefined) {
    updates.push(`email = $${n}`);
    params.push(email.trim().toLowerCase());
    n++;
  }
  if (password !== undefined && password !== '') {
    updates.push(`password_hash = $${n}`);
    params.push(await bcrypt.hash(password, 10));
    n++;
  }
  if (name !== undefined) {
    updates.push(`name = $${n}`);
    params.push((name || '').trim());
    n++;
  }
  if (cargo !== undefined) {
    updates.push(`cargo = $${n}`);
    params.push((cargo || '').trim());
    n++;
  }
  if (departamento !== undefined) {
    updates.push(`departamento = $${n}`);
    params.push((departamento || '').trim());
    n++;
  }
  if (updates.length === 0) {
    const r = await query(
      'SELECT id, email, role, name, cargo, departamento, created_at FROM users WHERE id = $1',
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json(r.rows[0]);
  }
  params.push(id);
  const q = `UPDATE users SET ${updates.join(', ')} WHERE id = $${n} RETURNING id, email, role, name, cargo, departamento, created_at`;
  const r = await query(q, params);
  if (!r.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(r.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (id === req.userId) {
    return res.status(400).json({ error: 'Não pode excluir a si mesmo' });
  }
  const r = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.status(204).send();
});

export default router;
