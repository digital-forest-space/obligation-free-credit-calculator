import { createClient, type Client } from '@libsql/client';

let _client: Client | null | undefined;

export function getTurso(): Client | null {
  if (_client !== undefined) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    _client = null;
    return null;
  }

  _client = createClient({ url, authToken });
  return _client;
}
