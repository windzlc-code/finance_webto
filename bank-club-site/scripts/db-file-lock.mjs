import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const defaultDbPath = path.join(process.cwd(), ".data", "bank-club-db.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readDbSnapshot(dbPath = defaultDbPath) {
  return readFile(dbPath, "utf8");
}

export async function readDbJson(dbPath = defaultDbPath) {
  return JSON.parse(await readDbSnapshot(dbPath));
}

async function writeSnapshotAtomically(dbPath, rawJson) {
  const tempPath = `${dbPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await writeFile(tempPath, rawJson, "utf8");
  await rename(tempPath, dbPath);
}

export async function acquireDbWriteLock(label = "smoke", dbPath = defaultDbPath) {
  const lockPath = path.join(path.dirname(dbPath), "bank-club-db.lock");
  await mkdir(path.dirname(lockPath), { recursive: true });
  const startedAt = Date.now();

  while (Date.now() - startedAt < 5000) {
    try {
      const handle = await open(lockPath, "wx");
      await handle.writeFile(`${label}:${process.pid}:${Date.now()}`);
      return async () => {
        await handle.close().catch(() => undefined);
        await unlink(lockPath).catch(() => undefined);
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      await sleep(25);
    }
  }

  throw new Error(`Timed out waiting for database write lock: ${lockPath}`);
}

export async function writeDbSnapshot(rawJson, { dbPath = defaultDbPath, label = "smoke" } = {}) {
  const releaseLock = await acquireDbWriteLock(label, dbPath);
  try {
    await writeSnapshotAtomically(dbPath, rawJson);
  } finally {
    await releaseLock();
  }
}

export async function mutateDbJson(mutator, { dbPath = defaultDbPath, label = "smoke" } = {}) {
  const releaseLock = await acquireDbWriteLock(label, dbPath);
  try {
    const db = JSON.parse(await readFile(dbPath, "utf8"));
    const result = await mutator(db);
    await writeSnapshotAtomically(dbPath, JSON.stringify(db, null, 2));
    return result;
  } finally {
    await releaseLock();
  }
}
