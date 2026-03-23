import { getTurso } from './turso';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS asset_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_name TEXT NOT NULL,
  voter_ip TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(asset_name, voter_ip)
)`;

const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_asset_votes_name ON asset_votes(asset_name)`;

let _tableReady = false;

async function ensureTable(): Promise<void> {
  if (_tableReady) return;
  const db = getTurso();
  if (!db) return;
  await db.execute(CREATE_TABLE_SQL);
  await db.execute(CREATE_INDEX_SQL);
  _tableReady = true;
}

export interface VoteCount {
  asset: string;
  count: number;
}

export async function getVoteCounts(): Promise<VoteCount[]> {
  const db = getTurso();
  if (!db) return [];
  await ensureTable();
  const result = await db.execute(
    'SELECT asset_name, COUNT(*) as cnt FROM asset_votes GROUP BY asset_name ORDER BY cnt DESC LIMIT 50',
  );
  return result.rows.map((row) => ({
    asset: String(row.asset_name),
    count: Number(row.cnt),
  }));
}

export async function castVote(
  assetName: string,
  voterIp: string,
): Promise<boolean> {
  const db = getTurso();
  if (!db) return false;
  await ensureTable();

  const normalized = assetName.trim().toUpperCase().slice(0, 20);
  if (!normalized || !/^[A-Z0-9]+$/.test(normalized)) return false;

  try {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO asset_votes (asset_name, voter_ip, created_at) VALUES (?, ?, ?)',
      args: [normalized, voterIp, Math.floor(Date.now() / 1000)],
    });
    return true;
  } catch {
    return false;
  }
}
