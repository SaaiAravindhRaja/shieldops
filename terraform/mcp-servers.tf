# ShieldOps MCP Server Registration Reference
# These define the custom MCP servers to register in Archestra's private registry

locals {
  mcp_servers = {
    incident_db = {
      name        = "shieldops-incident-db"
      description = "Security incident database - CRUD operations for incidents, evidence, and timeline events"
      version     = "1.0.0"
      command     = "node"
      args        = ["dist/index.js"]
      working_dir = "mcp-servers/incident-db"
      env = {
        DATABASE_URL = "postgresql://archestra:archestra@localhost:5432/archestra"
      }
      tools = [
        "create_incident",
        "update_incident",
        "get_incident",
        "list_incidents",
        "add_evidence",
        "get_incident_stats",
      ]
    }
    threat_intel = {
      name        = "shieldops-threat-intel"
      description = "Threat intelligence lookups - check IPs, domains, file hashes, and CVEs against VirusTotal, AbuseIPDB, and NVD"
      version     = "1.0.0"
      command     = "node"
      args        = ["dist/index.js"]
      working_dir = "mcp-servers/threat-intel"
      env = {
        VIRUSTOTAL_API_KEY = var.virustotal_api_key
        ABUSEIPDB_API_KEY  = var.abuseipdb_api_key
      }
      tools = [
        "check_ip",
        "check_hash",
        "check_domain",
        "check_cve",
        "bulk_check_ips",
      ]
    }
    security_playbook = {
      name        = "shieldops-security-playbook"
      description = "Security response playbooks - execute containment actions like IP blocking, pod isolation, and token revocation"
      version     = "1.0.0"
      command     = "node"
      args        = ["dist/index.js"]
      working_dir = "mcp-servers/security-playbook"
      tools = [
        "block_ip",
        "isolate_pod",
        "isolate_host",
        "revoke_token",
        "quarantine_user",
        "execute_playbook",
        "get_action_log",
      ]
    }
  }
}

# Additional variables for threat intel API keys
variable "virustotal_api_key" {
  description = "VirusTotal API key for file hash and domain reputation checks"
  type        = string
  sensitive   = true
  default     = ""
}

variable "abuseipdb_api_key" {
  description = "AbuseIPDB API key for IP reputation checks"
  type        = string
  sensitive   = true
  default     = ""
}
