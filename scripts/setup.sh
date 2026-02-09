#!/bin/bash
set -e

echo "========================================="
echo "  ShieldOps - AI Security Operations Center"
echo "  Powered by Archestra MCP Platform"
echo "========================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }

# Check for .env file
if [ ! -f .env ]; then
  echo "No .env file found. Creating from .env.example..."
  cp .env.example .env
  echo "Please edit .env with your API keys before continuing."
  exit 1
fi

echo "[1/4] Installing MCP server dependencies..."
cd mcp-servers/incident-db && npm install && cd ../..
cd mcp-servers/threat-intel && npm install && cd ../..
cd mcp-servers/security-playbook && npm install && cd ../..

echo "[2/4] Building MCP servers..."
cd mcp-servers/incident-db && npm run build && cd ../..
cd mcp-servers/threat-intel && npm run build && cd ../..
cd mcp-servers/security-playbook && npm run build && cd ../..

echo "[3/4] Starting infrastructure with Docker Compose..."
docker compose up -d

echo "[4/4] Waiting for services to be ready..."
echo "  Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U archestra 2>/dev/null; do
  sleep 2
done
echo "  PostgreSQL is ready!"

echo ""
echo "========================================="
echo "  ShieldOps is ready!"
echo "========================================="
echo ""
echo "  Archestra Admin UI:  http://localhost:3000"
echo "  Archestra API:       http://localhost:9000"
echo "  Grafana Dashboard:   http://localhost:3002 (admin/shieldops)"
echo "  Prometheus:          http://localhost:9090"
echo ""
echo "  Next steps:"
echo "  1. Open http://localhost:3000 and configure LLM API keys"
echo "  2. Register the MCP servers in Archestra's registry"
echo "  3. Create the ShieldOps agents"
echo "  4. Start monitoring for security incidents!"
echo ""
