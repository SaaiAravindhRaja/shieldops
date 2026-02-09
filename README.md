```
   _____ _     _      _     _  ___
  / ____| |   (_)    | |   | |/ _ \
 | (___ | |__  _  ___| | __| | | | |_ __  ___
  \___ \| '_ \| |/ _ \ |/ _` | | | | '_ \/ __|
  ____) | | | | |  __/ | (_| | |_| | |_) \__ \
 |_____/|_| |_|_|\___|_|\__,_|\___/| .__/|___/
                                    | |
                                    |_|
```

# ShieldOps

**Autonomous AI Security Operations Center** — detect, investigate, and respond to security incidents with a multi-agent pipeline orchestrated through [Archestra](https://archestra.ai).

5 specialized agents. 3 MCP tool servers. Full-stack observability.

---

### Agent Pipeline Flow

```mermaid
sequenceDiagram
    participant Alert as Incoming Alert
    participant S as Sentinel
    participant SH as Sherlock
    participant R as Responder
    participant CH as Chronicler
    participant O as Overseer

    Alert->>S: New security event
    activate S
    S->>S: Classify severity (P1-P4)
    S->>S: Create incident record
    S-->>SH: Route for investigation
    deactivate S

    activate SH
    SH->>SH: Lookup IPs, hashes, domains
    SH->>SH: Correlate threat intel
    SH->>SH: Attach evidence
    SH-->>R: Investigation complete
    deactivate SH

    activate R
    R->>O: Request approval (P1/P2 actions)
    activate O
    O-->>R: Approved
    deactivate O
    R->>R: Block IPs, revoke tokens
    R->>R: Isolate affected hosts
    R-->>CH: Containment complete
    deactivate R

    activate CH
    CH->>CH: Generate incident report
    CH->>CH: Check compliance (GDPR, SOC 2)
    CH->>CH: Close incident
    deactivate CH
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Google AI API key ([free — no credit card](https://aistudio.google.com/apikey))

### Setup

```bash
git clone https://github.com/SaaiAravindhRaja/shieldops.git
cd shieldops
cp .env.example .env
# add your API keys to .env
```

### Start the stack

```bash
docker compose up -d
```

| Service | Port | |
|---------|------|-|
| Archestra UI | `localhost:3000` | Platform admin |
| Archestra API | `localhost:9000` | REST API |
| PostgreSQL | `localhost:5432` | Incident store |
| Prometheus | `localhost:9090` | Metrics |
| Grafana | `localhost:3002` | Dashboards |

### Start the dashboard

```bash
cd dashboard
npm install
npm run dev
# http://localhost:3001
```

### Seed sample data

```bash
npx tsx scripts/seed-data.ts
```

---

## Agents

Each agent handles one phase of the incident response lifecycle. Models are assigned based on task complexity and cost.

| Agent | Role | Model | Tools |
|-------|------|-------|-------|
| **Sentinel** | Triage incoming alerts, classify severity | Gemini 2.5 Flash | `create_incident`, `list_incidents`, `get_incident_stats` |
| **Sherlock** | Deep investigation, threat correlation | Gemini 2.5 Pro | `check_ip`, `check_hash`, `check_domain`, `check_cve`, `bulk_check_ips`, `get_incident`, `add_evidence`, `update_incident` |
| **Responder** | Containment and remediation | Gemini 2.5 Flash | `block_ip`, `isolate_pod`, `revoke_token`, `quarantine_user`, `execute_playbook`, `get_action_log`, `update_incident`, `add_evidence` |
| **Chronicler** | Post-incident reporting, compliance | Gemini 2.5 Flash | `get_incident`, `update_incident`, `add_evidence`, `get_incident_stats` |
| **Overseer** | Pipeline orchestration, escalation | Gemini 2.5 Pro | All tools (cross-server) |

> All agents run on **Google Gemini free tier** — no credit card, no API costs. 15 requests/min, 1000 requests/day.

Archestra's **Dual LLM Security Engine** quarantines untrusted data before agents process it. **Tool Policies** enforce least-privilege — Sentinel can only triage, Responder can only contain.

---

## MCP Servers

| Server | Tools | Purpose |
|--------|-------|---------|
| `incident-db` | 6 | Incident CRUD, evidence management, statistics — backed by PostgreSQL |
| `threat-intel` | 5 | IP reputation, file hash analysis, domain lookups, CVE checks |
| `security-playbook` | 6 | Automated response: block, isolate, revoke, quarantine, playbook execution |

All servers use stdio transport and are registered in Archestra's MCP Registry with per-agent access controls.

---

## Archestra Platform Integration

| Feature | How it's used |
|---------|---------------|
| MCP Registry | 3 custom servers registered as private tools |
| Dual LLM Security | Quarantine untrusted alert data before agent processing |
| Tool Policies | Per-agent tool access — least-privilege enforcement |
| Cost & Limits | Zero-cost operation on Gemini free tier |
| LLM Proxies | Google Gemini routing via Archestra proxy |
| Observability | Prometheus metrics + OpenTelemetry traces |
| Terraform IaC | Full config in `terraform/` |
| Teams & RBAC | SOC team with role-based access |

---

## Cost Model

ShieldOps runs entirely on Google Gemini's free tier — zero API costs.

```mermaid
pie title Model Distribution
    "Gemini 2.5 Flash (Sentinel)" : 3
    "Gemini 2.5 Pro (Sherlock)" : 3
    "Gemini 2.5 Flash (Responder)" : 3
    "Gemini 2.5 Flash (Chronicler)" : 1
    "Gemini 2.5 Pro (Overseer)" : 3
```

| Task tier | Model | Cost | Rate limit |
|-----------|-------|------|------------|
| P4 triage | Gemini 2.5 Flash | Free | 15 RPM |
| P3 analysis | Gemini 2.5 Flash | Free | 15 RPM |
| P1 forensics | Gemini 2.5 Pro | Free | 15 RPM |
| Reporting | Gemini 2.5 Flash | Free | 15 RPM |
| Orchestration | Gemini 2.5 Pro | Free | 15 RPM |

**Commercial equivalent:** ~$320/day &nbsp;→&nbsp; **ShieldOps with Gemini:** $0/day

---

## Dashboard

Next.js 16 app with real-time SOC visibility:

- **Overview** — KPIs, severity breakdown, incident feed, agent status
- **Incidents** — Filterable table, drill-down to investigation timeline and evidence
- **Agents** — Live monitoring with cost gauges, tool usage, activity logs
- **Metrics** — Cost trends, MTTR, detection rates, model cost comparison
- **Settings** — Connection status, platform feature overview

---

## Project Structure

```
shieldops/
├── dashboard/             # Next.js 16 + Tailwind v4 + Recharts
│   ├── app/               # Pages: overview, incidents, agents, metrics, settings
│   ├── components/        # Sidebar, command bar
│   └── lib/               # Types, utils, mock data
├── mcp-servers/
│   ├── incident-db/       # 6 tools — incident CRUD
│   ├── threat-intel/      # 5 tools — threat lookups
│   └── security-playbook/ # 6 tools — response actions
├── terraform/             # Archestra IaC
│   ├── agents.tf          # 5 agent definitions
│   ├── mcp-servers.tf     # Server registration
│   └── prompts/           # Agent system prompts
├── grafana/               # Dashboard provisioning
├── scripts/               # DB schema + seed data
├── docker-compose.yml
└── prometheus.yml
```

---

## Configuring Archestra

After starting the stack, open `localhost:3000`:

1. **LLM API Key** — Add your Google AI key (free at [aistudio.google.com](https://aistudio.google.com/apikey))
2. **Security Engine** — Enable Dual LLM for prompt injection protection
3. **MCP Registry** — Register the 3 tool servers
4. **Agents** — Create the 5 agents with their system prompts
5. **Tool Policies** — Assign per-agent tool access
6. **Teams** — Create SOC team and assign roles

Or apply everything at once with Terraform:

```bash
cd terraform
terraform init && terraform apply
```

---

## License

MIT
