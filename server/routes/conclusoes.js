import { Router } from 'express';
import { nanoid } from 'nanoid';
import { query } from '../db.js';
import { requireAuth, attachUser } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(attachUser);

router.post('/', async (req, res) => {
  const { taskId, subtaskId, tipo } = req.body || {};
  if (!taskId || !tipo || !['subtarefa_concluida', 'tarefa_concluida'].includes(tipo)) {
    return res.status(400).json({ error: 'taskId e tipo (subtarefa_concluida | tarefa_concluida) obrigatórios' });
  }
  const userId = req.userId;
  const task = await query('SELECT id FROM tasks WHERE id = $1', [taskId]);
  if (!task.rows[0]) return res.status(404).json({ error: 'Tarefa não encontrada' });
  if (tipo === 'subtarefa_concluida' && subtaskId) {
    const sub = await query('SELECT id FROM subtasks WHERE id = $1 AND task_id = $2', [subtaskId, taskId]);
    if (!sub.rows[0]) return res.status(404).json({ error: 'Subtask não encontrada' });
  }
  const id = nanoid(10);
  await query(
    'INSERT INTO conclusoes (id, user_id, task_id, subtask_id, tipo) VALUES ($1, $2, $3, $4, $5)',
    [id, userId, taskId, tipo === 'subtarefa_concluida' ? subtaskId || null : null, tipo]
  );
  res.status(201).json({ id, user_id: userId, task_id: taskId, subtask_id: subtaskId || null, tipo });
});

export default router;
