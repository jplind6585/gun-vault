// SQLite schema for Gun Vault
// Based on handoff doc Section 17

export const SCHEMA_VERSION = 1;

export const CREATE_GUNS_TABLE = `
CREATE TABLE IF NOT EXISTS guns (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  caliber TEXT NOT NULL,
  action TEXT NOT NULL,
  type TEXT NOT NULL,
  serial_number TEXT,
  acquired_date TEXT,
  acquired_price REAL,
  acquired_from TEXT,
  condition TEXT,
  status TEXT DEFAULT 'Active',
  barrel_length REAL,
  overall_length REAL,
  weight REAL,
  finish TEXT,
  stock_grip TEXT,
  notes TEXT,
  image_url TEXT,
  insurance_value REAL,
  estimated_fmv REAL,
  fmv_updated TEXT,
  nfa_item INTEGER DEFAULT 0,
  nfa_approval_date TEXT,
  suppressor_host INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  gun_id TEXT NOT NULL,
  date TEXT NOT NULL,
  rounds_expended INTEGER NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gun_id) REFERENCES guns(id)
);
`;

// View for computed round counts
export const CREATE_ROUND_COUNT_VIEW = `
CREATE VIEW IF NOT EXISTS gun_round_counts AS
  SELECT gun_id, SUM(rounds_expended) as total_rounds
  FROM sessions
  GROUP BY gun_id;
`;

// Indexes for performance
export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_guns_status ON guns(status);
CREATE INDEX IF NOT EXISTS idx_guns_type ON guns(type);
CREATE INDEX IF NOT EXISTS idx_sessions_gun_id ON sessions(gun_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
`;

export interface Gun {
  id: string;
  make: string;
  model: string;
  caliber: string;
  action: 'Semi-Auto' | 'Bolt' | 'Lever' | 'Pump' | 'Revolver' | 'Break' | 'Single Shot';
  type: 'Pistol' | 'Rifle' | 'Shotgun' | 'Suppressor' | 'NFA';
  serialNumber?: string;
  acquiredDate?: string;
  acquiredPrice?: number;
  acquiredFrom?: string;
  condition?: 'New' | 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  status: 'Active' | 'Stored' | 'Transferred' | 'Decommissioned';
  roundCount?: number; // Computed from sessions
  barrelLength?: number;
  overallLength?: number;
  weight?: number;
  finish?: string;
  stockGrip?: string;
  notes?: string;
  imageUrl?: string;
  insuranceValue?: number;
  estimatedFMV?: number;
  fmvUpdated?: string;
  nfaItem?: boolean;
  nfaApprovalDate?: string;
  suppressorHost?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  gunId: string;
  date: string;
  roundsExpended: number;
  location?: string;
  notes?: string;
  createdAt?: string;
}
