# ShieldOps Agent Definitions for Archestra
# All agents use Google Gemini (free tier) — no API costs

# --- Agent Configuration Reference (for manual creation in Archestra UI) ---

locals {
  agents = {
    sentinel = {
      name          = "Sentinel"
      description   = "Security alert triage agent - classifies incoming alerts by severity (P1-P4) and routes them to the appropriate agent"
      system_prompt = "prompts/sentinel.md"
      model         = "gemini-2.5-flash"
      provider      = "gemini"
      tools         = ["create_incident", "list_incidents", "get_incident_stats"]
      budget_daily  = 0
    }
    sherlock = {
      name          = "Sherlock"
      description   = "Security investigation agent - conducts deep forensic analysis with dual LLM quarantine for malicious content"
      system_prompt = "prompts/sherlock.md"
      model         = "gemini-2.5-pro"
      provider      = "gemini"
      tools         = ["check_ip", "check_hash", "check_domain", "check_cve", "bulk_check_ips", "get_incident", "add_evidence", "update_incident"]
      budget_daily  = 0
      dual_llm      = true
    }
    responder = {
      name          = "Responder"
      description   = "Incident response agent - executes security playbooks and containment actions"
      system_prompt = "prompts/responder.md"
      model         = "gemini-2.5-flash"
      provider      = "gemini"
      tools         = ["block_ip", "isolate_pod", "revoke_token", "quarantine_user", "execute_playbook", "get_action_log", "update_incident", "add_evidence"]
      budget_daily  = 0
    }
    chronicler = {
      name          = "Chronicler"
      description   = "Compliance and reporting agent - generates post-incident reports and checks regulatory obligations"
      system_prompt = "prompts/chronicler.md"
      model         = "gemini-2.5-flash"
      provider      = "gemini"
      tools         = ["get_incident", "update_incident", "add_evidence", "get_incident_stats"]
      budget_daily  = 0
    }
    overseer = {
      name          = "Overseer"
      description   = "Security operations orchestrator - coordinates all agents, manages budgets, and handles escalation"
      system_prompt = "prompts/overseer.md"
      model         = "gemini-2.5-pro"
      provider      = "gemini"
      tools         = ["create_incident", "update_incident", "get_incident", "list_incidents", "get_incident_stats", "check_ip", "block_ip", "execute_playbook"]
      budget_daily  = 0
    }
  }
}
