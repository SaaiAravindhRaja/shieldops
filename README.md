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

# ShieldOps - AI Security Operations Center

> **5 AI agents. 3 MCP servers. 1 autonomous SOC.**
> Built on [Archestra](https://archestra.ai) for the 2 Fast 2 MCP Hackathon.

ShieldOps is an AI-powered Security Operations Center that automatically triages, investigates, and responds to security incidents using a team of specialized AI agents orchestrated through Archestra's MCP platform.

---

## Architecture

```
                          ┌─────────────────────────────────────────────────┐
                          │              Archestra Platform                 │
                          │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
                          │  │ MCP     │  │ Dual LLM │  │ Tool         │  │
                          │  │ Registry│  │ Security │  │ Policies     │  │
                          │  └─────────┘  └──────────┘  └──────────────┘  │
                          │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
                          │  │ LLM     │  │ Cost &   │  │ Observability│  │
                          │  │ Proxies │  │ Limits   │  │ (OTel)       │  │
                          │  └─────────┘  └──────────┘  └──────────────┘  │
                          └──────────────────┬──────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
         ┌──────────▼──────────┐  ┌──────────▼──────────┐  ┌──────────▼──────────┐
         │   Incident DB MCP   │  │  Threat Intel MCP   │  │  Security Playbook  │
         │                     │  │                     │  │       MCP           │
         │  create_incident    │  │  check_ip           │  │  block_ip           │
         │  update_incident    │  │  check_hash         │  │  isolate_pod        │
         │  get_incident       │  │  check_domain       │  │  revoke_token       │
         │  list_incidents     │  │  check_cve          │  │  quarantine_user    │
         │  add_evidence       │  │  bulk_check_ips     │  │  execute_playbook   │
         │  get_incident_stats │  │                     │  │  get_action_log     │
         └──────────┬──────────┘  └─────────────────────┘  └─────────────────────┘
                    │
              ┌─────▼─────┐
              │ PostgreSQL │
              └───────────┘

    ┌────────────────────────────────────────────────────────────────────────────┐
    │                          AI Agent Pipeline                                │
    │                                                                            │
    │  Alert ──► Sentinel ──► Sherlock ──► Responder ──► Chronicler              │
    │            (Triage)     (Investigate)  (Contain)    (Report)                │
    │            GPT-4o-mini  Claude Sonnet  GPT-4o       Gemini Flash            │
    │            $0.001/call  $0.05/call     $0.03/call   $0.001/call             │
    │                                                                            │
    │                         Overseer (Orchestrator)                             │
    │                         Claude Sonnet - $0.05/call                          │
    └────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- API keys: OpenAI, Anthropic, Google AI (for LLM agents)
- Optional: VirusTotal, AbuseIPDB (for threat intel enrichment)

### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/shieldops.git
cd shieldops
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
| Service | Port | Description |
|---------|------|-------------|
| Archestra UI | [localhost:3000](http://localhost:3000) | MCP platform admin |
| Archestra API | [localhost:9000](http://localhost:9000) | Platform API |
| PostgreSQL | localhost:5432 | Incident database |
| Prometheus | [localhost:9090](http://localhost:9090) | Metrics collection |
| Grafana | [localhost:3002](http://localhost:3002) | Metrics dashboards |

### 3. Start Dashboard

```bash
cd dashboard
npm install
npm run dev
# Opens at http://localhost:3001
```

### 4. Seed Demo Data (Optional)

```bash
npx tsx scripts/seed-data.ts
```

---

## Agent Pipeline

ShieldOps uses a 5-agent pipeline where each agent specializes in one phase of incident response:

### Sentinel - Alert Triage
- **Model:** GPT-4o-mini (OpenAI) - $0.001/call
- **Role:** First responder. Classifies incoming alerts by severity (P1-P4) and routes to specialists.
- **Tools:** `create_incident`, `list_incidents`, `get_incident_stats`
- **Why this model:** Fast and cheap for high-volume triage. Processes 47+ alerts/day.

### Sherlock - Deep Investigation
- **Model:** Claude Sonnet (Anthropic) - $0.05/call
- **Role:** Forensic investigator. Analyzes threats, correlates evidence, identifies attack patterns.
- **Tools:** `check_ip`, `check_hash`, `check_domain`, `check_cve`, `bulk_check_ips`, `get_incident`, `add_evidence`, `update_incident`
- **Why this model:** Superior reasoning for complex investigation chains.
- **Security:** Uses Archestra's **Dual LLM Security Engine** to quarantine untrusted data (phishing payloads, prompt injections) before analysis.

### Responder - Containment & Remediation
- **Model:** GPT-4o (OpenAI) - $0.03/call
- **Role:** Executes containment actions. Blocks IPs, isolates pods, revokes credentials.
- **Tools:** `block_ip`, `isolate_pod`, `revoke_token`, `quarantine_user`, `execute_playbook`, `get_action_log`, `update_incident`, `add_evidence`
- **Why this model:** Reliable tool execution with structured output.

### Chronicler - Compliance & Reporting
- **Model:** Gemini Flash (Google) - $0.001/call
- **Role:** Generates post-incident reports, checks regulatory obligations (GDPR, SOC 2).
- **Tools:** `get_incident`, `update_incident`, `add_evidence`, `get_incident_stats`
- **Why this model:** Fast and cost-effective for document generation.

### Overseer - Orchestrator
- **Model:** Claude Sonnet (Anthropic) - $0.05/call
- **Role:** Manages the entire pipeline. Approves high-risk actions, manages budgets, handles escalation.
- **Tools:** All critical tools across all MCP servers.
- **Why this model:** Best judgment for high-stakes decisions.

---

## MCP Servers

Three custom MCP servers built with `@modelcontextprotocol/sdk`:

| Server | Tools | Description |
|--------|-------|-------------|
| **incident-db** | 6 | CRUD operations for incidents, evidence, and statistics via PostgreSQL |
| **threat-intel** | 5 | IP reputation (AbuseIPDB), hash analysis (VirusTotal), domain/CVE checks |
| **security-playbook** | 6 | Automated response actions: block, isolate, revoke, quarantine, playbooks |

All servers use the **stdio transport** and are registered in Archestra's **MCP Registry** with per-agent **Tool Policies** controlling access.

---

## Archestra Features Used

ShieldOps leverages every major Archestra platform feature:

- [x] **MCP Registry** - 3 custom MCP servers registered as private tools
- [x] **Dual LLM Security Engine** - Quarantine untrusted data with numeric-only LLM responses to prevent prompt injection
- [x] **Tool Policies** - Per-agent tool access controls (Sentinel can only triage, Responder can only contain)
- [x] **Cost & Limits** - Per-agent daily budgets ($0.50-$30/day) enforced at platform level
- [x] **LLM Proxies** - Multi-model routing across OpenAI, Anthropic, and Google AI
- [x] **Observability** - Prometheus metrics + OpenTelemetry traces for all agent actions
- [x] **Terraform IaC** - Full infrastructure defined as code (`terraform/`)
- [x] **Teams & RBAC** - SOC team with role-based access controls

---

## Cost Optimization

ShieldOps achieves **96% cost reduction** vs. using a single premium model for everything:

| Task | Model | Cost/Call | Volume | Rationale |
|------|-------|-----------|--------|-----------|
| P4 Triage | GPT-4o-mini | $0.001 | High | Simple classification |
| P3 Analysis | GPT-4o | $0.03 | Medium | Structured responses |
| P1 Forensics | Claude Sonnet | $0.05 | Low | Deep reasoning |
| Reporting | Gemini Flash | $0.001 | Medium | Document generation |
| Orchestration | Claude Sonnet | $0.05 | Low | Critical decisions |

**Single-model approach:** ~$320/day (GPT-4o for everything)
**ShieldOps dynamic switching:** ~$12/day (right model for each task)

---

## Dashboard

The ShieldOps dashboard is a Next.js application providing real-time visibility into the SOC:

- **SOC Overview** - Active incidents, agent status, MTTR trends, cost tracking
- **Incidents** - Filterable list with severity/status badges, drill-down to timeline & evidence
- **Agents** - Real-time monitoring of 5 AI agents with cost gauges and activity logs
- **Metrics** - Cost breakdown, detection rates, MTTR trends, model cost comparison
- **Settings** - Archestra connection config, feature status, quick links

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Platform | [Archestra](https://archestra.ai) v1.0.39 |
| Dashboard | Next.js 16 + Tailwind CSS v4 + Recharts |
| MCP Servers | TypeScript + @modelcontextprotocol/sdk |
| Database | PostgreSQL 16 |
| Infrastructure | Docker Compose + Terraform |
| Monitoring | Prometheus + Grafana + OpenTelemetry |
| LLM Providers | OpenAI, Anthropic, Google AI |

---

## Project Structure

```
shieldops/
├── dashboard/          # Next.js SOC dashboard (port 3001)
│   ├── app/            # Pages: overview, incidents, agents, metrics, settings
│   └── lib/            # Utils, types, mock data
├── mcp-servers/        # Custom MCP servers
│   ├── incident-db/    # 6 tools - Incident CRUD via PostgreSQL
│   ├── threat-intel/   # 5 tools - IP/hash/domain/CVE lookups
│   └── security-playbook/ # 6 tools - Response actions
├── terraform/          # Archestra IaC configuration
│   ├── main.tf         # Provider config
│   ├── agents.tf       # 5 agent definitions
│   ├── mcp-servers.tf  # MCP server registration
│   └── prompts/        # Agent system prompts
├── grafana/            # Grafana dashboards & provisioning
├── scripts/            # DB init & seed data
├── docker-compose.yml  # Full stack orchestration
├── prometheus.yml      # Metrics scraping config
└── .env.example        # Environment variable template
```

---

## Archestra Configuration Guide

After `docker compose up -d`, configure Archestra at [localhost:3000](http://localhost:3000):

1. **Settings > LLM API Keys** - Add your OpenAI, Anthropic, and Google AI API keys
2. **Settings > Security Engine** - Enable Dual LLM to protect against prompt injection
3. **MCP Registry** - Register the 3 MCP servers (incident-db, threat-intel, security-playbook)
4. **Agents** - Create 5 agents with their assigned models and system prompts
5. **Tool Policies** - Configure per-agent tool access controls
6. **Cost & Limits** - Set daily budgets per agent
7. **Teams** - Create "SOC Team" and assign roles

Or use Terraform:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## License

MIT

---

Built with Archestra for the [2 Fast 2 MCP Hackathon](https://wemakedevs.org) by WeMakeDevs.
