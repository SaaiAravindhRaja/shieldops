-- ShieldOps Database Initialization
-- This runs automatically when PostgreSQL starts via docker-compose

-- Enable UUID generation (used by default IDs)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the shieldops schema tables
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('P1', 'P2', 'P3', 'P4')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaging', 'investigating', 'responding', 'resolved', 'closed')),
  type TEXT NOT NULL CHECK (type IN ('phishing', 'malware', 'data_breach', 'ddos', 'unauthorized_access', 'suspicious_commit', 'anomalous_traffic', 'policy_violation', 'other')),
  source TEXT NOT NULL DEFAULT 'manual',
  assigned_agent TEXT,
  cost_usd NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  collected_by TEXT NOT NULL DEFAULT 'Sherlock',
  threat_score NUMERIC(5, 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  tool_used TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_timeline_incident ON timeline_events(incident_id);
