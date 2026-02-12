import 'dotenv/config';
import { runMigrations } from '../db.js';

runMigrations()
  .then(() => {
    console.log('Migrations OK');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
