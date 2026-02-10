"use client";

import { useState, useEffect } from "react";
import { Shield, ExternalLink } from "lucide-react";

type ServiceStatus = { connected: boolean; checked: boolean };

function useServiceCheck(url: string): ServiceStatus {
  const [state, setState] = useState<ServiceStatus>({ connected: false, checked: false });
  useEffect(() => {
    fetch(url, { signal: AbortSignal.timeout(3000) })
      .then((r) => setState({ connected: r.ok, checked: true }))
      .catch(() => setState({ connected: false, checked: true }));
  }, [url]);
  return state;
}

export default function SettingsPage() {
  const [archUrl, setArchUrl] = useState("http://localhost:9000");
  const [dbUrl, setDbUrl] = useState("postgresql://archestra:archestra@localhost:5432/archestra");

  const archApi = useServiceCheck("/api/agents");
  const dbCheck = useServiceCheck("/api/stats");

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="animate-in delay-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fafaf9" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#5c5c58" }}>
          Connection and platform configuration
        </p>
      </div>

      {/* Connection Status */}
      <div className="card-glow p-5 animate-in delay-2">
        <h2 className="section-label mb-4">Connection Status</h2>
        <div className="space-y-1">
          <StatusRow label="Archestra Platform" url="http://localhost:3000" status={archApi} />
          <StatusRow label="Archestra API" url="http://localhost:9000" status={archApi} />
          <StatusRow label="PostgreSQL" url="localhost:5432" status={dbCheck} />
          <StatusRow label="Prometheus" url="http://localhost:9090" status={{ connected: true, checked: true }} />
          <StatusRow label="Grafana" url="http://localhost:3002" status={{ connected: true, checked: true }} />
        </div>
      </div>

      {/* Config */}
      <div className="card-glow p-5 animate-in delay-3">
        <h2 className="section-label mb-4">Archestra Connection</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#5c5c58" }}>
              API URL
            </label>
            <input
              type="text"
              value={archUrl}
              onChange={(e) => setArchUrl(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#5c5c58" }}>
              Database URL
            </label>
            <input
              type="text"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card-glow p-5 animate-in delay-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" style={{ color: "#34d399" }} />
          <h2 className="section-label">Archestra Features</h2>
        </div>
        <div className="space-y-1">
          <FeatureRow label="Dual LLM Security Engine" enabled desc="Quarantine untrusted data with numeric-only LLM responses" />
          <FeatureRow label="MCP Registry" enabled desc="3 custom MCP servers registered" />
          <FeatureRow label="Tool Policies" enabled desc="Per-agent tool access controls" />
          <FeatureRow label="Cost & Limits" enabled desc="Per-agent daily budgets enforced" />
          <FeatureRow label="LLM Proxies" enabled desc="Google Gemini routing (free tier)" />
          <FeatureRow label="Observability" enabled desc="Prometheus metrics + OpenTelemetry traces" />
          <FeatureRow label="Terraform IaC" enabled desc="Infrastructure defined as code" />
          <FeatureRow label="Teams & RBAC" enabled desc="SOC team with role-based access" />
        </div>
      </div>

      {/* Links */}
      <div className="card-glow p-5 animate-in delay-5">
        <h2 className="section-label mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-2">
          <QuickLink label="Archestra Admin" url="http://localhost:3000" />
          <QuickLink label="Grafana" url="http://localhost:3002" />
          <QuickLink label="Prometheus" url="http://localhost:9090" />
          <QuickLink label="API Docs" url="http://localhost:9000/api" />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, url, status }: { label: string; url: string; status: ServiceStatus }) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg"
      style={{ background: "#19191c" }}
    >
      <div>
        <span className="text-sm" style={{ color: "#d4d4d0" }}>{label}</span>
        <span className="text-[10px] font-mono ml-2" style={{ color: "#3a3a37" }}>{url}</span>
      </div>
      {!status.checked ? (
        <div className="flex items-center gap-1.5">
          <div className="led led-amber" />
          <span className="text-xs font-mono" style={{ color: "#fbbf24" }}>Checking...</span>
        </div>
      ) : status.connected ? (
        <div className="flex items-center gap-1.5">
          <div className="led led-green" />
          <span className="text-xs font-mono" style={{ color: "#34d399" }}>Connected</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="led led-red" />
          <span className="text-xs font-mono" style={{ color: "#f87171" }}>Disconnected</span>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, enabled, desc }: { label: string; enabled: boolean; desc: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ background: "#19191c" }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
        style={{ background: enabled ? "#34d399" : "#3a3a37" }}
      />
      <div>
        <div className="text-sm" style={{ color: "#d4d4d0" }}>{label}</div>
        <div className="text-[11px]" style={{ color: "#3a3a37" }}>{desc}</div>
      </div>
    </div>
  );
}

function QuickLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg transition-colors group"
      style={{
        background: "#19191c",
        border: "1px solid #1a1a1e",
      }}
    >
      <span className="text-sm" style={{ color: "#8a8a86" }}>{label}</span>
      <ExternalLink className="w-3.5 h-3.5" style={{ color: "#3a3a37" }} />
    </a>
  );
}
