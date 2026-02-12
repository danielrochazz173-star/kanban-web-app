import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requireAuth, attachUser } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import boardsRoutes from './routes/boards.js';
import assignmentsRoutes from './routes/assignments.js';
import conclusoesRoutes from './routes/conclusoes.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/conclusoes', conclusoesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/me', requireAuth, attachUser, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Usuário não encontrado' });
  res.json(req.user);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor em http://0.0.0.0:${PORT}`);
});
