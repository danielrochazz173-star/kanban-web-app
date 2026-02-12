import { Router } from 'express';
import { nanoid } from 'nanoid';
import { query } from '../db.js';
import { requireAuth, requireRole, attachUser } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(attachUser);

function buildBoardsTree(boardsRows, columnsRows, tasksRows, subtasksRows) {
  const columnsByBoard = new Map();
  for (const c of columnsRows) {
    if (!columnsByBoard.has(c.board_id)) columnsByBoard.set(c.board_id, []);
    columnsByBoard.get(c.board_id).push(c);
  }
  const tasksByColumn = new Map();
  for (const t of tasksRows) {
    if (!tasksByColumn.has(t.column_id)) tasksByColumn.set(t.column_id, []);
    tasksByColumn.get(t.column_id).push(t);
  }
  const subtasksByTask = new Map();
  for (const s of subtasksRows) {
    if (!subtasksByTask.has(s.task_id)) subtasksByTask.set(s.task_id, []);
    subtasksByTask.get(s.task_id).push(s);
  }
  return boardsRows.map((b) => {
    const columns = (columnsByBoard.get(b.id) || []).sort((a, b) => a.position - b.position);
    return {
      id: b.id,
      name: b.name,
      columns: columns.map((c) => {
        const tasks = (tasksByColumn.get(c.id) || []).sort((a, b) => a.position - b.position);
        return {
          id: c.id,
          name: c.name,
          tasks: tasks.map((t) => {
            const subtasks = (subtasksByTask.get(t.id) || []).map((s) => ({
              id: s.id,
              title: s.title,
              isCompleted: s.is_completed,
            }));
            return {
              id: t.id,
              title: t.title,
              description: t.description || '',
              status: t.status,
              subtasks,
            };
          }),
        };
      }),
    };
  });
}

router.get('/', async (req, res) => {
  const [boardsR, columnsR, tasksR, subtasksR] = await Promise.all([
    query('SELECT id, name FROM boards ORDER BY created_at'),
    query('SELECT id, board_id, name, position FROM columns ORDER BY board_id, position'),
    query('SELECT id, column_id, title, description, status, position FROM tasks'),
    query('SELECT id, task_id, title, is_completed FROM subtasks'),
  ]);
  const boards = buildBoardsTree(
    boardsR.rows,
    columnsR.rows,
    tasksR.rows,
    subtasksR.rows.map((s) => ({ ...s, is_completed: s.is_completed }))
  );
  res.json({ boards });
});

router.post('/', requireRole('gestor'), async (req, res) => {
  const { name, columns } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome do board obrigatório' });
  const boardId = nanoid(10);
  await query('INSERT INTO boards (id, name) VALUES ($1, $2)', [boardId, name.trim()]);
  const cols = columns || [];
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const colId = col.id || nanoid(10);
    await query('INSERT INTO columns (id, board_id, name, position) VALUES ($1, $2, $3, $4)', [
      colId,
      boardId,
      (col.name || '').trim(),
      i,
    ]);
    const tasks = col.tasks || [];
    for (let j = 0; j < tasks.length; j++) {
      const t = tasks[j];
      const taskId = t.id || nanoid(10);
      await query(
        'INSERT INTO tasks (id, column_id, title, description, status, position) VALUES ($1, $2, $3, $4, $5, $6)',
        [taskId, colId, (t.title || '').trim(), t.description || '', t.status || col.name || 'Todo', j]
      );
      for (const s of t.subtasks || []) {
        const subId = s.id || nanoid(10);
        await query('INSERT INTO subtasks (id, task_id, title, is_completed) VALUES ($1, $2, $3, $4)', [
          subId,
          taskId,
          (s.title || '').trim(),
          !!s.isCompleted,
        ]);
      }
    }
  }
  const [boardsR, columnsR, tasksR, subtasksR] = await Promise.all([
    query('SELECT id, name FROM boards WHERE id = $1', [boardId]),
    query('SELECT id, board_id, name, position FROM columns WHERE board_id = $1', [boardId]),
    query('SELECT id, column_id, title, description, status, position FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = $1)', [boardId]),
    query('SELECT id, task_id, title, is_completed FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = $1))', [boardId]),
  ]);
  const boards = buildBoardsTree(
    boardsR.rows,
    columnsR.rows,
    tasksR.rows,
    subtasksR.rows.map((s) => ({ ...s, is_completed: s.is_completed }))
  );
  res.status(201).json(boards[0]);
});

router.put('/:id', async (req, res) => {
  const boardId = req.params.id;
  const { name, columns } = req.body || {};
  const b = await query('SELECT id FROM boards WHERE id = $1', [boardId]);
  if (!b.rows[0]) return res.status(404).json({ error: 'Board não encontrado' });
  if (name !== undefined) {
    await query('UPDATE boards SET name = $1 WHERE id = $2', [name.trim(), boardId]);
  }
  if (columns !== undefined) {
    await query('DELETE FROM columns WHERE board_id = $1', [boardId]);
    const cols = Array.isArray(columns) ? columns : [];
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const colId = col.id || nanoid(10);
      await query('INSERT INTO columns (id, board_id, name, position) VALUES ($1, $2, $3, $4)', [
        colId,
        boardId,
        (col.name || '').trim(),
        i,
      ]);
      const tasks = col.tasks || [];
      for (let j = 0; j < tasks.length; j++) {
        const t = tasks[j];
        const taskId = t.id || nanoid(10);
        await query(
          'INSERT INTO tasks (id, column_id, title, description, status, position) VALUES ($1, $2, $3, $4, $5, $6)',
          [taskId, colId, (t.title || '').trim(), t.description || '', t.status || col.name || 'Todo', j]
        );
        for (const s of t.subtasks || []) {
          const subId = s.id || nanoid(10);
          await query('INSERT INTO subtasks (id, task_id, title, is_completed) VALUES ($1, $2, $3, $4)', [
            subId,
            taskId,
            (s.title || '').trim(),
            !!s.isCompleted,
          ]);
        }
      }
    }
  }
  const [boardsR, columnsR, tasksR, subtasksR] = await Promise.all([
    query('SELECT id, name FROM boards WHERE id = $1', [boardId]),
    query('SELECT id, board_id, name, position FROM columns WHERE board_id = $1', [boardId]),
    query('SELECT id, column_id, title, description, status, position FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = $1)', [boardId]),
    query('SELECT id, task_id, title, is_completed FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = $1))', [boardId]),
  ]);
  const boards = buildBoardsTree(
    boardsR.rows,
    columnsR.rows,
    tasksR.rows,
    subtasksR.rows.map((s) => ({ ...s, is_completed: s.is_completed }))
  );
  res.json(boards[0]);
});

router.delete('/:id', requireRole('gestor'), async (req, res) => {
  const r = await query('DELETE FROM boards WHERE id = $1 RETURNING id', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Board não encontrado' });
  res.status(204).send();
});

export default router;
