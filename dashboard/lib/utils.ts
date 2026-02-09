import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

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

/* ── Severity Config ────────────────────────────── */
export const severityConfig = {
  P1: {
    label: "Critical",
    color: "text-p1",
    hex: "#f87171",
    dotClass: "severity-dot-p1",
    cardAccent: "card-accent-critical",
    badge: "badge-critical",
    glow: "hover:border-p1/30",
    textClass: "text-p1",
    bgClass: "bg-p1/15",
    borderClass: "border-p1/30",
    pulse: true,
  },
  P2: {
    label: "High",
    color: "text-p2",
    hex: "#fb923c",
    dotClass: "severity-dot-p2",
    cardAccent: "card-accent-high",
    badge: "badge-high",
    glow: "hover:border-p2/30",
    textClass: "text-p2",
    bgClass: "bg-p2/15",
    borderClass: "border-p2/30",
    pulse: false,
  },
  P3: {
    label: "Medium",
    color: "text-warning",
    hex: "#fbbf24",
    dotClass: "bg-warning",
    cardAccent: "card-accent-medium",
    badge: "badge-medium",
    glow: "hover:border-warning/30",
    textClass: "text-warning",
    bgClass: "bg-warning/15",
    borderClass: "border-warning/30",
    pulse: false,
  },
  P4: {
    label: "Low",
    color: "text-success",
    hex: "#34d399",
    dotClass: "bg-success",
    cardAccent: "card-accent-low",
    badge: "badge-low",
    glow: "hover:border-success/30",
    textClass: "text-success",
    bgClass: "bg-success/15",
    borderClass: "border-success/30",
    pulse: false,
  },
} as const;

/* ── Status Config ──────────────────────────────── */
export const statusConfig = {
  open: { label: "Open", color: "text-p1", bg: "bg-p1/10", badge: "badge-critical", textClass: "text-p1", bgClass: "bg-p1/10" },
  triaging: { label: "Triaging", color: "text-warning", bg: "bg-warning/10", badge: "badge-medium", textClass: "text-warning", bgClass: "bg-warning/10" },
  investigating: { label: "Investigating", color: "text-p2", bg: "bg-p2/10", badge: "badge-high", textClass: "text-p2", bgClass: "bg-p2/10" },
  responding: { label: "Responding", color: "text-warning", bg: "bg-warning/10", badge: "badge-medium", textClass: "text-warning", bgClass: "bg-warning/10" },
  resolved: { label: "Resolved", color: "text-success", bg: "bg-success/10", badge: "badge-low", textClass: "text-success", bgClass: "bg-success/10" },
  closed: { label: "Closed", color: "text-muted-foreground", bg: "bg-muted/10", badge: "badge-neutral", textClass: "text-muted-foreground", bgClass: "bg-muted/10" },
} as const;

/* ── Chart Colors ───────────────────────────────── */
export const SEVERITY_COLORS = {
  P1: "#f87171",
  P2: "#fb923c",
  P3: "#fbbf24",
  P4: "#34d399",
};

export const AGENT_COLORS: Record<string, string> = {
  sentinel: "#34d399",
  sherlock: "#fb923c",
  responder: "#fbbf24",
  chronicler: "#60a5fa",
  overseer: "#a78bfa",
};
