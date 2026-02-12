import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiJson, type LoginResponse } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Heading from '../../components/Heading';
import '../../assets/styles/index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiJson<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.token, data.user);
      if (data.user.role === 'gestor') {
        navigate('/gestor', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="main-content main-content--no-content" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <Heading level={1} className="" style={{ marginBottom: 24 }}>Entrar</Heading>
        <form onSubmit={handleSubmit}>
          {error && (
            <p role="alert" style={{ color: 'var(--color-red)', marginBottom: 12 }}>{error}</p>
          )}
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: '100%', padding: 10, marginTop: 4, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 16 }}>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ width: '100%', padding: 10, marginTop: 4, boxSizing: 'border-box' }}
            />
          </label>
          <Button type="submit" variant="primary" size="l" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p style={{ marginTop: 16 }}>
          <Link to="/register" style={{ color: 'var(--color-purple)' }}>Criar conta (gestor)</Link>
        </p>
      </div>
    </main>
  );
}
