import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { query } from '../db.js';

const email = process.argv[2] || 'gestor@localhost';
const password = process.argv[3] || 'gestor123';
const name = process.argv[4] || 'Gestor';

async function seed() {
  const id = nanoid(10);
  const password_hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (id, email, password_hash, role, name, cargo, departamento)
     VALUES ($1, $2, $3, 'gestor', $4, '', '')
     ON CONFLICT (email) DO NOTHING`,
    [id, email.toLowerCase(), password_hash, name]
  );
  console.log('Gestor criado:', email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
