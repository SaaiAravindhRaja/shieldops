export type Severity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "open" | "triaging" | "investigating" | "responding" | "resolved" | "closed";
export type IncidentType =
  | "phishing"
  | "malware"
  | "data_breach"
  | "ddos"
  | "unauthorized_access"
  | "suspicious_commit"
  | "anomalous_traffic"
  | "policy_violation"
  | "other";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  type: IncidentType;
  source: string;
  assigned_agent: string | null;
  cost_total: number;
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
  event_type: string;
  description: string;
  agent: string | null;
  created_at: string;
}

export interface AgentInfo {
  name: string;
  description: string;
  model: string;
  provider: string;
  status: "active" | "idle" | "error";
  dailyBudget: number;
  costToday: number;
  incidentsHandled: number;
  lastAction: string;
  lastActionTime: string;
  tools: string[];
}

export interface IncidentStats {
  total: number;
  active: number;
  resolved: number;
  mttrMinutes: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<string, number>;
  totalCost: number;
  costBySeverity: Record<Severity, number>;
  dailyVolume: { date: string; count: number }[];
  mttrTrend: { date: string; mttr: number }[];
}
