import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const sql = neon(process.env.DATABASE_URL!);
export default sql;
