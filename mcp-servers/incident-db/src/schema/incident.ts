import { z } from "zod";

export const SeveritySchema = z.enum(["P1", "P2", "P3", "P4"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const IncidentStatusSchema = z.enum([
  "open",
  "triaging",
  "investigating",
  "responding",
  "resolved",
  "closed",
]);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const IncidentTypeSchema = z.enum([
  "phishing",
  "malware",
  "data_breach",
  "ddos",
  "unauthorized_access",
  "suspicious_commit",
  "anomalous_traffic",
  "policy_violation",
  "other",
]);
export type IncidentType = z.infer<typeof IncidentTypeSchema>;

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  type: IncidentType;
  source: string;
  assigned_agent: string | null;
  evidence: Evidence[];
  timeline: TimelineEvent[];
  cost_usd: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Evidence {
  id: string;
  incident_id: string;
  type: string;
  content: string;
  source: string;
  collected_by: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  incident_id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: string;
}
