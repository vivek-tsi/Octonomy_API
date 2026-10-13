import { Client } from 'pg';

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim();
}

function required(name: string): string {
  const value = stripQuotes(process.env[name] || '');
  if (!value) {
    throw new Error(`${name} is empty. Set it in env/.env.${process.env.test_env || 'test'} from your DBeaver connection.`);
  }
  return value;
}

/** Run a read query using the DB_* values for the active environment. */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = new Client({
    host: required('DB_HOST'),
    port: Number(required('DB_PORT')),
    database: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    ssl: stripQuotes(process.env.DB_SSL || 'false') === 'true' ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
  });

  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    await client.end();
  }
}
