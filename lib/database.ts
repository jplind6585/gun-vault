// SQLite database setup
// Local-first, offline-first architecture

import * as SQLite from 'expo-sqlite';
import {
  CREATE_GUNS_TABLE,
  CREATE_SESSIONS_TABLE,
  CREATE_ROUND_COUNT_VIEW,
  CREATE_INDEXES,
  SCHEMA_VERSION,
  type Gun,
  type Session,
} from '../db/schema';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database connection and run migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('gunvault.db');

  // Run migrations
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    ${CREATE_GUNS_TABLE}
    ${CREATE_SESSIONS_TABLE}
    ${CREATE_ROUND_COUNT_VIEW}
    ${CREATE_INDEXES}
  `);

  console.log('Database initialized');
  return db;
}

/**
 * Get database instance
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============================================================================
// GUN OPERATIONS
// ============================================================================

/**
 * Get all guns with their round counts
 */
export async function getAllGuns(): Promise<Gun[]> {
  const database = getDatabase();

  const result = await database.getAllAsync<any>(`
    SELECT
      g.*,
      COALESCE(rc.total_rounds, 0) as round_count
    FROM guns g
    LEFT JOIN gun_round_counts rc ON g.id = rc.gun_id
    WHERE g.status != 'Decommissioned'
    ORDER BY g.created_at DESC
  `);

  return result.map(mapGunFromDb);
}

/**
 * Get gun by ID with round count
 */
export async function getGunById(id: string): Promise<Gun | null> {
  const database = getDatabase();

  const result = await database.getFirstAsync<any>(`
    SELECT
      g.*,
      COALESCE(rc.total_rounds, 0) as round_count
    FROM guns g
    LEFT JOIN gun_round_counts rc ON g.id = rc.gun_id
    WHERE g.id = ?
  `, [id]);

  return result ? mapGunFromDb(result) : null;
}

/**
 * Add new gun to vault
 */
export async function addGun(gun: Omit<Gun, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = getDatabase();
  const id = generateId();

  await database.runAsync(
    `INSERT INTO guns (
      id, make, model, caliber, action, type, serial_number,
      acquired_date, acquired_price, acquired_from, condition, status,
      barrel_length, overall_length, weight, finish, stock_grip, notes,
      image_url, insurance_value, nfa_item, suppressor_host
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      gun.make,
      gun.model,
      gun.caliber,
      gun.action,
      gun.type,
      gun.serialNumber || null,
      gun.acquiredDate || null,
      gun.acquiredPrice || null,
      gun.acquiredFrom || null,
      gun.condition || null,
      gun.status || 'Active',
      gun.barrelLength || null,
      gun.overallLength || null,
      gun.weight || null,
      gun.finish || null,
      gun.stockGrip || null,
      gun.notes || null,
      gun.imageUrl || null,
      gun.insuranceValue || null,
      gun.nfaItem ? 1 : 0,
      gun.suppressorHost ? 1 : 0,
    ]
  );

  return id;
}

/**
 * Update gun
 */
export async function updateGun(id: string, updates: Partial<Gun>): Promise<void> {
  const database = getDatabase();

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.make !== undefined) { fields.push('make = ?'); values.push(updates.make); }
  if (updates.model !== undefined) { fields.push('model = ?'); values.push(updates.model); }
  if (updates.caliber !== undefined) { fields.push('caliber = ?'); values.push(updates.caliber); }
  if (updates.action !== undefined) { fields.push('action = ?'); values.push(updates.action); }
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.serialNumber !== undefined) { fields.push('serial_number = ?'); values.push(updates.serialNumber); }
  if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await database.runAsync(
    `UPDATE guns SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Decommission gun (soft delete)
 */
export async function decommissionGun(id: string): Promise<void> {
  await updateGun(id, { status: 'Decommissioned' });
}

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

/**
 * Log a shooting session
 * This is the ONLY way to increment round count
 */
export async function logSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<string> {
  const database = getDatabase();
  const id = generateId();

  await database.runAsync(
    `INSERT INTO sessions (id, gun_id, date, rounds_expended, location, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      session.gunId,
      session.date,
      session.roundsExpended,
      session.location || null,
      session.notes || null,
    ]
  );

  return id;
}

/**
 * Get sessions for a gun
 */
export async function getSessionsForGun(gunId: string): Promise<Session[]> {
  const database = getDatabase();

  const result = await database.getAllAsync<any>(
    `SELECT * FROM sessions WHERE gun_id = ? ORDER BY date DESC`,
    [gunId]
  );

  return result.map(mapSessionFromDb);
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function mapGunFromDb(row: any): Gun {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    caliber: row.caliber,
    action: row.action,
    type: row.type,
    serialNumber: row.serial_number,
    acquiredDate: row.acquired_date,
    acquiredPrice: row.acquired_price,
    acquiredFrom: row.acquired_from,
    condition: row.condition,
    status: row.status,
    roundCount: row.round_count || 0,
    barrelLength: row.barrel_length,
    overallLength: row.overall_length,
    weight: row.weight,
    finish: row.finish,
    stockGrip: row.stock_grip,
    notes: row.notes,
    imageUrl: row.image_url,
    insuranceValue: row.insurance_value,
    estimatedFMV: row.estimated_fmv,
    fmvUpdated: row.fmv_updated,
    nfaItem: Boolean(row.nfa_item),
    nfaApprovalDate: row.nfa_approval_date,
    suppressorHost: Boolean(row.suppressor_host),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSessionFromDb(row: any): Session {
  return {
    id: row.id,
    gunId: row.gun_id,
    date: row.date,
    roundsExpended: row.rounds_expended,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
