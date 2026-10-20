import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { Task } from './tasks/entities/task.entity.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const dataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Task],
  migrations: [
    join(dirname(fileURLToPath(import.meta.url)), 'migrations', '*.js'),
  ],
  synchronize: false,
});

export default dataSource;
