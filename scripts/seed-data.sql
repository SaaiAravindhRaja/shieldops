-- ShieldOps Demo Seed Data
-- Run: psql -U archestra -d archestra -f seed-data.sql

-- P1: Active Data Breach
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at)
VALUES ('a0000001-0000-0000-0000-000000000001', 'Active Data Breach - Customer Database Exposed',
  'Unauthorized access detected to production PostgreSQL cluster. Sensitive PII data potentially exfiltrated via compromised service account credentials.',
  'P1', 'investigating', 'data_breach', 'CloudTrail Alert', 'Sherlock', 1250.00, NOW() - INTERVAL '2 hours');

INSERT INTO evidence (incident_id, type, content, source, collected_by) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'ip', '185.220.101.34 - Tor exit node, abuse confidence 95/100', 'AbuseIPDB', 'Sherlock'),
  ('a0000001-0000-0000-0000-000000000001', 'log', 'SELECT * FROM users WHERE 1=1 -- 47 rows affected', 'PostgreSQL Audit', 'Sherlock'),
  ('a0000001-0000-0000-0000-000000000001', 'hash', 'a3f2b8c1d4e5f6789012345678abcdef - Known exfiltration tool', 'VirusTotal', 'Sherlock');

INSERT INTO timeline_events (incident_id, agent, action, details, timestamp) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Sentinel', 'Alert Triaged', 'Classified as P1 - Active data breach detected', NOW() - INTERVAL '2 hours'),
  ('a0000001-0000-0000-0000-000000000001', 'Sherlock', 'Investigation Started', 'Initiating forensic analysis of access logs', NOW() - INTERVAL '1 hour 50 minutes'),
  ('a0000001-0000-0000-0000-000000000001', 'Sherlock', 'Evidence Collected', 'IP 185.220.101.34 flagged as Tor exit node', NOW() - INTERVAL '1 hour 30 minutes'),
  ('a0000001-0000-0000-0000-000000000001', 'Responder', 'IP Blocked', 'Firewall rule fw-a3c89d12 created', NOW() - INTERVAL '50 minutes'),
  ('a0000001-0000-0000-0000-000000000001', 'Sherlock', 'Malware Hash Found', 'File hash detected matches known exfiltration tool', NOW() - INTERVAL '45 minutes'),
  ('a0000001-0000-0000-0000-000000000001', 'Responder', 'Service Account Revoked', 'Compromised account svc-analytics revoked', NOW() - INTERVAL '30 minutes');

-- P1: Ransomware Detection
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at)
VALUES ('a0000001-0000-0000-0000-000000000002', 'Ransomware Detection - Production Servers',
  'File encryption activity detected across 3 production servers. Ransom note found in /tmp directory.',
  'P1', 'responding', 'malware', 'CrowdStrike EDR', 'Responder', 2100.00, NOW() - INTERVAL '5 hours');

INSERT INTO timeline_events (incident_id, agent, action, details, timestamp) VALUES
  ('a0000001-0000-0000-0000-000000000002', 'Sentinel', 'Alert Triaged', 'Classified as P1 - Ransomware activity detected', NOW() - INTERVAL '5 hours'),
  ('a0000001-0000-0000-0000-000000000002', 'Sherlock', 'Investigation Started', 'Analyzing encrypted file patterns', NOW() - INTERVAL '4 hours 45 minutes'),
  ('a0000001-0000-0000-0000-000000000002', 'Responder', 'Servers Isolated', 'Network isolation applied to 3 affected servers', NOW() - INTERVAL '4 hours 30 minutes'),
  ('a0000001-0000-0000-0000-000000000002', 'Overseer', 'Playbook Approved', 'Approved ransomware containment playbook execution', NOW() - INTERVAL '4 hours');

-- P2: Phishing with Prompt Injection (showcases Dual LLM!)
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at, resolved_at)
VALUES ('a0000001-0000-0000-0000-000000000003', 'Phishing Campaign with Hidden Prompt Injection',
  'Spear-phishing emails containing hidden prompt injection payloads targeting our AI analysis pipeline. Archestra Dual LLM Security Engine quarantined the malicious content.',
  'P2', 'resolved', 'phishing', 'Email Gateway', 'Chronicler', 340.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 13 minutes');

INSERT INTO timeline_events (incident_id, agent, action, details, timestamp) VALUES
  ('a0000001-0000-0000-0000-000000000003', 'Sentinel', 'Alert Triaged', 'Classified as P2 - Phishing with embedded injection payload', NOW() - INTERVAL '1 day'),
  ('a0000001-0000-0000-0000-000000000003', 'Sherlock', 'Dual LLM Quarantine', 'Malicious payload quarantined by Archestra Security Engine. Numeric-only LLM prevented prompt injection.', NOW() - INTERVAL '23 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000003', 'Responder', 'Emails Quarantined', 'Blocked 23 emails from sender domain evil-corp.xyz', NOW() - INTERVAL '23 hours 30 minutes'),
  ('a0000001-0000-0000-0000-000000000003', 'Chronicler', 'Report Generated', 'Compliance report filed for attempted prompt injection attack', NOW() - INTERVAL '23 hours 13 minutes');

-- P2: Suspicious GitHub Commit
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at)
VALUES ('a0000001-0000-0000-0000-000000000004', 'Suspicious GitHub Commit - Auth Backdoor',
  'Commit a8f3c2d introduces a hardcoded credential bypass in the authentication module.',
  'P2', 'investigating', 'suspicious_commit', 'GitHub Webhook', 'Sherlock', 520.00, NOW() - INTERVAL '6 hours');

-- P2: DDoS Attack
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at, resolved_at)
VALUES ('a0000001-0000-0000-0000-000000000005', 'DDoS Attack on API Gateway',
  'Volumetric DDoS attack targeting /api/auth endpoint. Peak traffic at 2.4M requests/sec.',
  'P2', 'resolved', 'ddos', 'Cloudflare Alert', 'Chronicler', 890.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 28 minutes');

-- P3 incidents
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at, resolved_at) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'Failed Authentication Spike - Brute Force', 'Over 500 failed login attempts from IP range 103.x.x.x in 10 minutes.', 'P3', 'resolved', 'unauthorized_access', 'Auth Service', 'Responder', 45.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 23 hours 48 minutes'),
  ('a0000001-0000-0000-0000-000000000007', 'S3 Bucket Policy Violation - Public Access', 'S3 bucket data-exports-prod changed to public access.', 'P3', 'resolved', 'policy_violation', 'AWS Config', 'Chronicler', 35.00, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 23 hours 32 minutes'),
  ('a0000001-0000-0000-0000-000000000008', 'Anomalous Outbound Traffic - Data Exfiltration?', 'Unusual 4.2GB outbound transfer to unknown IP during off-hours.', 'P3', 'investigating', 'anomalous_traffic', 'Network Monitor', 'Sherlock', 180.00, NOW() - INTERVAL '8 hours'),
  ('a0000001-0000-0000-0000-000000000009', 'Credential Scan Detected - Internal Network', 'Port scanning and credential spraying from internal IP 10.0.3.47.', 'P3', 'responding', 'unauthorized_access', 'IDS Alert', 'Responder', 95.00, NOW() - INTERVAL '4 hours'),
  ('a0000001-0000-0000-0000-000000000010', 'Firewall Config Drift Detected', 'Production firewall rules diverged from Terraform state.', 'P3', 'resolved', 'policy_violation', 'Config Audit', 'Chronicler', 20.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 22 hours');

-- P4 incidents
INSERT INTO incidents (id, title, description, severity, status, type, source, assigned_agent, cost_usd, created_at, resolved_at) VALUES
  ('a0000001-0000-0000-0000-000000000011', 'CVE-2026-8234 - Critical OpenSSL Vulnerability', 'New CVE published affecting OpenSSL 3.1.x used in production.', 'P4', 'open', 'other', 'NVD Feed', NULL, 5.00, NOW() - INTERVAL '1 hour', NULL),
  ('a0000001-0000-0000-0000-000000000012', 'External Port Scan from Known Scanner', 'Shodan/Censys scan of external IP range detected.', 'P4', 'resolved', 'other', 'Firewall Logs', 'Responder', 8.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 55 minutes'),
  ('a0000001-0000-0000-0000-000000000013', 'TLS Certificate Expiring in 7 Days', 'Wildcard cert *.shieldops.io expires Feb 16.', 'P4', 'open', 'other', 'Cert Monitor', NULL, 2.00, NOW() - INTERVAL '1 day', NULL),
  ('a0000001-0000-0000-0000-000000000014', 'Stale Service Account - No Activity 90 Days', 'Service account svc-legacy-etl has not been used in 90 days.', 'P4', 'resolved', 'policy_violation', 'IAM Audit', 'Responder', 10.00, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 21 hours'),
  ('a0000001-0000-0000-0000-000000000015', 'Outdated Dependency - Known Vulnerability', 'Package lodash@4.17.20 has known prototype pollution vulnerability.', 'P4', 'closed', 'other', 'Snyk Scan', 'Chronicler', 5.00, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 20 hours');

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'ShieldOps seed data loaded: 15 incidents, evidence, and timeline events';
END $$;
