-- Database initialization for NYC FHV Driver Dashboard
CREATE TABLE IF NOT EXISTS drivers (
  license_number TEXT PRIMARY KEY,
  driver_name TEXT,
  borough TEXT,
  active BOOLEAN DEFAULT TRUE,
  base_name TEXT,
  base_number TEXT,
  dataset_last_updated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_drivers_borough ON drivers (borough);
CREATE INDEX IF NOT EXISTS idx_drivers_driver_name ON drivers (driver_name);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
