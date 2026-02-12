import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiJson, type LoginResponse } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Heading from '../../components/Heading';
import '../../assets/styles/index.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiJson<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role: 'gestor' }),
      });
      login(data.token, data.user);
      navigate('/gestor', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="main-content main-content--no-content" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <Heading level={1} style={{ marginBottom: 24 }}>Registrar (Gestor)</Heading>
        <form onSubmit={handleSubmit}>
          {error && (
            <p role="alert" style={{ color: 'var(--color-red)', marginBottom: 12 }}>{error}</p>
          )}
          <label style={{ display: 'block', marginBottom: 8 }}>
            Nome
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: 10, marginTop: 4, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              minLength={6}
              style={{ width: '100%', padding: 10, marginTop: 4, boxSizing: 'border-box' }}
            />
          </label>
          <Button type="submit" variant="primary" size="l" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Registrando…' : 'Registrar'}
          </Button>
        </form>
        <p style={{ marginTop: 16 }}>
          <Link to="/login" style={{ color: 'var(--color-purple)' }}>Já tem conta? Entrar</Link>
        </p>
      </div>
    </main>
  );
}
