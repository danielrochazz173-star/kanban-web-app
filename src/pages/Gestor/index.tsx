import React, { useState, useEffect } from 'react';
import { apiJson, type BoardsResponse } from '../../api';
import type { User } from '../../api';
import Heading from '../../components/Heading';
import Button from '../../components/Button';
import '../../assets/styles/index.css';

type AssignmentRow = { task_id: string; user_id: string; task_title: string; board_name: string; user_name: string };
type TaskOption = { id: string; title: string; boardName: string };

export default function Gestor() {
  const [funcionarios, setFuncionarios] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [assignTaskId, setAssignTaskId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', cargo: '', departamento: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [list, assigns, boardsRes] = await Promise.all([
        apiJson<User[]>('/users/funcionarios'),
        apiJson<AssignmentRow[]>('/assignments'),
        apiJson<BoardsResponse>('/boards'),
      ]);
      setFuncionarios(list);
      setAssignments(assigns);
      const flat: TaskOption[] = [];
      for (const b of boardsRes.boards) {
        for (const col of b.columns) {
          for (const t of col.tasks) {
            flat.push({ id: t.id, title: t.title, boardName: b.name });
          }
        }
      }
      setTasks(flat);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!assignTaskId || !assignUserId) return;
    setError('');
    try {
      await apiJson(`/assignments/task/${assignTaskId}/user/${assignUserId}`, { method: 'POST' });
      setAssignTaskId('');
      setAssignUserId('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atribuir');
    }
  }

  async function handleUnassign(taskId: string, userId: string) {
    try {
      await apiJson(`/assignments/task/${taskId}/user/${userId}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ email: '', password: '', name: '', cargo: '', departamento: '' });
    setFormOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ email: u.email, password: '', name: u.name, cargo: u.cargo || '', departamento: u.departamento || '' });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await apiJson(`/users/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, password: form.password || undefined }),
        });
      } else {
        if (!form.password) {
          setError('Senha obrigatória para novo funcionário');
          return;
        }
        await apiJson('/users', {
          method: 'POST',
          body: JSON.stringify({ ...form, role: 'funcionario' }),
        });
      }
      setFormOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este funcionário?')) return;
    try {
      await apiJson(`/users/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  return (
    <main className="main-content" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Heading level={1}>Gestor – Funcionários</Heading>
        <Button type="button" variant="primary" onPointerDown={() => openNew()}>
          + Novo funcionário
        </Button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--color-red)', marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <p>Carregando…</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: 32 }}>
            <Heading level={2} style={{ marginBottom: 12 }}>Funcionários</Heading>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Cargo</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Departamento</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f) => (
                  <tr key={f.id}>
                    <td style={{ padding: 8 }}>{f.name}</td>
                    <td style={{ padding: 8 }}>{f.email}</td>
                    <td style={{ padding: 8 }}>{f.cargo || '–'}</td>
                    <td style={{ padding: 8 }}>{f.departamento || '–'}</td>
                    <td style={{ padding: 8 }}>
                      <Button type="button" variant="secondary" size="s" onPointerDown={() => openEdit(f)}>Editar</Button>
                      {' '}
                      <Button type="button" variant="secondary" size="s" onPointerDown={() => handleDelete(f.id)}>Excluir</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Heading level={2} style={{ marginBottom: 12 }}>Atribuir tarefa ao funcionário</Heading>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={assignTaskId} onChange={(e) => setAssignTaskId(e.target.value)} style={{ padding: 8, minWidth: 200 }}>
                <option value="">Selecione a tarefa</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.boardName} – {t.title}</option>
                ))}
              </select>
              <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} style={{ padding: 8, minWidth: 180 }}>
                <option value="">Selecione o funcionário</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <Button type="button" variant="primary" onPointerDown={handleAssign} disabled={!assignTaskId || !assignUserId}>
                Atribuir
              </Button>
            </div>
          </div>
          <div>
            <Heading level={2} style={{ marginBottom: 12 }}>Atribuições atuais</Heading>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Tarefa</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Board</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Funcionário</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={`${a.task_id}-${a.user_id}`}>
                    <td style={{ padding: 8 }}>{a.task_title}</td>
                    <td style={{ padding: 8 }}>{a.board_name}</td>
                    <td style={{ padding: 8 }}>{a.user_name}</td>
                    <td style={{ padding: 8 }}>
                      <Button type="button" variant="secondary" size="s" onPointerDown={() => handleUnassign(a.task_id, a.user_id)}>Remover</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assignments.length === 0 && <p style={{ marginTop: 8 }}>Nenhuma atribuição.</p>}
          </div>
        </>
      )}
      {formOpen && (
        <div className="backdrop-modal" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-sidebar_header_modals_card-task)', padding: 24, borderRadius: 8, width: '100%', maxWidth: 400 }}>
            <Heading level={2} style={{ marginBottom: 16 }}>{editing ? 'Editar funcionário' : 'Novo funcionário'}</Heading>
            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Nome *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Email *
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  readOnly={!!editing}
                  style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Senha {editing ? '(deixe vazio para não alterar)' : '*'}
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Cargo
                <input
                  value={form.cargo}
                  onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
                  style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 16 }}>
                Departamento
                <input
                  value={form.departamento}
                  onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value }))}
                  style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="submit" variant="primary">Salvar</Button>
                <Button type="button" variant="secondary" onPointerDown={() => setFormOpen(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
