import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole, attachUser } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(attachUser);

router.get('/', requireRole('gestor'), async (req, res) => {
  const r = await query(
    `SELECT a.task_id, a.user_id, t.title as task_title, b.name as board_name, u.name as user_name
     FROM task_assignments a
     JOIN tasks t ON t.id = a.task_id
     JOIN columns c ON c.id = t.column_id
     JOIN boards b ON b.id = c.board_id
     JOIN users u ON u.id = a.user_id
     ORDER BY u.name, b.name, t.title`
  );
  res.json(r.rows);
});

router.get('/task/:taskId', async (req, res) => {
  const r = await query(
    `SELECT u.id, u.email, u.name, u.cargo, u.departamento FROM task_assignments a
     JOIN users u ON u.id = a.user_id WHERE a.task_id = $1`,
    [req.params.taskId]
  );
  res.json(r.rows);
});

router.post('/task/:taskId/user/:userId', requireRole('gestor'), async (req, res) => {
  const { taskId, userId } = req.params;
  const task = await query('SELECT id FROM tasks WHERE id = $1', [taskId]);
  if (!task.rows[0]) return res.status(404).json({ error: 'Tarefa não encontrada' });
  const user = await query('SELECT id, role FROM users WHERE id = $1', [userId]);
  if (!user.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.rows[0].role !== 'funcionario') {
    return res.status(400).json({ error: 'Só é possível atribuir a funcionário' });
  }
  await query(
    'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT (task_id, user_id) DO NOTHING',
    [taskId, userId]
  );
  res.status(204).send();
});

router.delete('/task/:taskId/user/:userId', requireRole('gestor'), async (req, res) => {
  const r = await query(
    'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2 RETURNING task_id',
    [req.params.taskId, req.params.userId]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Atribuição não encontrada' });
  res.status(204).send();
});

router.get('/user/:userId/tasks', async (req, res) => {
  const r = await query(
    `SELECT t.id, t.title, t.status, c.name as column_name, b.name as board_name, b.id as board_id
     FROM task_assignments a
     JOIN tasks t ON t.id = a.task_id
     JOIN columns c ON c.id = t.column_id
     JOIN boards b ON b.id = c.board_id
     WHERE a.user_id = $1`,
    [req.params.userId]
  );
  res.json(r.rows);
});

export default router;
