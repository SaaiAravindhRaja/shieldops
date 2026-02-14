# ShieldOps

Autonomous, multi‑agent Security Operations Center (SOC) built on the Archestra MCP platform. ShieldOps triages alerts, investigates indicators, executes containment playbooks, and produces compliance‑ready reports through **real MCP tool calls** and a PostgreSQL evidence chain.

---

## Highlights

- **Real MCP execution**: the simulation triggers live tool calls against MCP servers (not scripted UI).
- **5 specialized agents**: least‑privilege tool access per phase (triage → investigate → respond → report → oversee).
- **Tamper‑evident evidence chain**: timeline + evidence hashes displayed per incident.
- **Production‑style stack**: PostgreSQL, Prometheus, Grafana, and IaC via Terraform.
- **Zero‑cost demo path**: works with mock data or live with Docker stack.

---

## Quick Start

```bash
git clone https://github.com/SaaiAravindhRaja/shieldops.git
cd shieldops
cp .env.example .env

# Start infrastructure
Docker compose up -d

# Start dashboard (standalone or live)
cd dashboard
npm install
npm run dev
```

Dashboard: **http://localhost:3001**  
Archestra UI: **http://localhost:3000**

| Service | Port | Purpose |
| --- | --- | --- |
| Dashboard | 3001 | SOC UI |
| Archestra UI | 3000 | MCP orchestration |
| Archestra API | 9000 | Agent management |
| PostgreSQL | 5432 | Incident DB |
| Prometheus | 9090 | Metrics |
| Grafana | 3002 | Observability |

---

## Demo: Live Simulation

Open **/simulate** and run any scenario. Each step executes a real MCP tool call and displays JSON‑RPC protocol messages.

Pipeline preview:

1. **Sentinel** triages alert → `incident-db/create_incident`
2. **Sherlock** investigates → `threat-intel/*` lookups
3. **Overseer** approves high‑risk actions
4. **Responder** contains → `security-playbook/*`
5. **Chronicler** reports → incident closed with compliance checks

---

## Architecture

```
shieldops/
├── dashboard/               # Next.js 16 + Tailwind v4 + Recharts
│   ├── app/                 # UI + API routes
│   ├── components/          # Sidebar, command bar
│   └── lib/                 # MCP engine, data hooks, utilities
├── mcp-servers/
│   ├── incident-db/         # Incident lifecycle + evidence chain
│   ├── threat-intel/        # AbuseIPDB / VirusTotal / NVD
│   └── security-playbook/   # Containment actions + playbooks
├── terraform/               # Archestra IaC
├── grafana/                 # Provisioned dashboards
├── scripts/                 # DB init + seed data
└── docker-compose.yml
```

---

## Agents

| Agent | Phase | Model | MCP Tools |
| --- | --- | --- | --- |
| Sentinel | Triage | Gemini 2.5 Flash | `create_incident`, `list_incidents`, `get_incident_stats` |
| Sherlock | Investigate | Gemini 2.5 Pro | `check_ip`, `check_hash`, `check_domain`, `check_cve`, `bulk_check_ips`, `get_incident`, `add_evidence`, `update_incident` |
| Responder | Contain | Gemini 2.5 Flash | `block_ip`, `isolate_pod`, `isolate_host`, `revoke_token`, `quarantine_user`, `execute_playbook` |
| Chronicler | Report | Gemini 2.5 Flash | `get_incident`, `update_incident`, `add_evidence`, `get_incident_stats` |
| Overseer | Orchestrate | Gemini 2.5 Pro | All tools (approval authority) |

---

## MCP Servers (18 tools)

| Server | Tools | Transport | Capability |
| --- | --- | --- | --- |
| incident-db | 6 | stdio | PostgreSQL‑backed incident lifecycle + evidence chain |
| threat-intel | 5 | stdio | AbuseIPDB, VirusTotal, NVD integration |
| security-playbook | 7 | stdio | Containment actions + playbook execution |

---

## Webhook Ingestion

ShieldOps accepts alerts via:

```bash
curl -X POST http://localhost:3001/api/webhook/alert \
  -H "Content-Type: application/json" \
  -d '{"title":"Suspicious login from new country","severity":"P2","type":"unauthorized_access","source":"auth-service"}'
```

Prometheus AlertManager format is also supported.

---

## Notes

- Works fully with mock data if the DB is not available.
- For live threat‑intel lookups, provide API keys in `.env`.
- Intended for demos, hackathons, and proof‑of‑concept deployments.

---

## License

MIT
