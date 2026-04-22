import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '../../data/volleytrip.db');

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export default db;
