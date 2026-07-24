// Script para inicializar la base de datos de Supabase ejecutando setup.sql
// Ejecutar con: node scratch/setup_db.js

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres.tlhbpzwzqmcrutwxomqy:glucena1918%2A%2A@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function setupDatabase() {
  console.log('Conectando a la base de datos de Supabase...');
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conexión establecida con éxito.');

    const sqlFilePath = path.join(__dirname, '../supabase/setup.sql');
    console.log(`Leyendo archivo SQL desde: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Ejecutando sentencias SQL...');
    await client.query(sql);
    console.log('¡Base de datos configurada con éxito! Tablas, índices y políticas creados.');

  } catch (err) {
    console.error('Error al configurar la base de datos:', err);
  } finally {
    await client.end();
  }
}

setupDatabase();
