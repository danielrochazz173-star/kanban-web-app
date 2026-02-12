import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole, attachUser } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(attachUser);
router.use(requireRole('gestor'));

router.get('/produtividade', async (req, res) => {
  const { userId, desde, ate } = req.query;
  const params = [];
  let joinClause = 'LEFT JOIN conclusoes c ON c.user_id = u.id';
  if (desde) {
    params.push(desde);
    joinClause += ` AND c.created_at >= $${params.length}`;
  }
  if (ate) {
    params.push(ate);
    joinClause += ` AND c.created_at <= $${params.length}`;
  }
  let q = `
    SELECT u.id, u.name, u.email, u.cargo, u.departamento,
           COUNT(c.id) FILTER (WHERE c.tipo = 'tarefa_concluida') as tarefas_concluidas,
           COUNT(c.id) FILTER (WHERE c.tipo = 'subtarefa_concluida') as subtarefas_concluidas,
           COUNT(c.id) as total_conclusoes
    FROM users u
    ${joinClause}
    WHERE u.role = 'funcionario'
  `;
  if (userId) {
    params.push(userId);
    q += ` AND u.id = $${params.length}`;
  }
  q += ` GROUP BY u.id, u.name, u.email, u.cargo, u.departamento ORDER BY u.name`;
  const r = await query(q, params);
  res.json(r.rows.map((row) => ({
    ...row,
    tarefas_concluidas: parseInt(row.tarefas_concluidas || '0', 10),
    subtarefas_concluidas: parseInt(row.subtarefas_concluidas || '0', 10),
    total_conclusoes: parseInt(row.total_conclusoes || '0', 10),
  })));
});

router.get('/produtividade/:userId', async (req, res) => {
  const { userId } = req.params;
  const { desde, ate } = req.query;
  let q = `
    SELECT c.id, c.tipo, c.task_id, c.subtask_id, c.created_at, t.title as task_title
    FROM conclusoes c
    LEFT JOIN tasks t ON t.id = c.task_id
    WHERE c.user_id = $1
  `;
  const params = [userId];
  if (desde) {
    params.push(desde);
    q += ` AND c.created_at >= $${params.length}`;
  }
  if (ate) {
    params.push(ate);
    q += ` AND c.created_at <= $${params.length}`;
  }
  q += ` ORDER BY c.created_at DESC LIMIT 200`;
  const r = await query(q, params);
  res.json(r.rows);
});

export default router;
