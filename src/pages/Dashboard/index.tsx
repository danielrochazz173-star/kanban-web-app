import React, { useState, useEffect } from 'react';
import { apiJson } from '../../api';
import Heading from '../../components/Heading';
import '../../assets/styles/index.css';

type ProdutividadeRow = {
  id: string;
  name: string;
  email: string;
  cargo: string | null;
  departamento: string | null;
  tarefas_concluidas: number;
  subtarefas_concluidas: number;
  total_conclusoes: number;
};

export default function Dashboard() {
  const [rows, setRows] = useState<ProdutividadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await apiJson<ProdutividadeRow[]>('/dashboard/produtividade');
      setRows(list);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="main-content" style={{ padding: 24 }}>
      <Heading level={1} style={{ marginBottom: 24 }}>Dashboard – Produtividade</Heading>
      {error && <p role="alert" style={{ color: 'var(--color-red)', marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <p>Carregando…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Funcionário</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Tarefas concluídas</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Subtarefas concluídas</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Total conclusões</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 8 }}>{r.name}</td>
                  <td style={{ padding: 8 }}>{r.email}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{r.tarefas_concluidas}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{r.subtarefas_concluidas}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{r.total_conclusoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p style={{ marginTop: 16 }}>Nenhum funcionário ou nenhuma conclusão registrada.</p>}
        </div>
      )}
    </main>
  );
}
