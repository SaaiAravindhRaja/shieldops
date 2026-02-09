# ShieldOps Agent Definitions for Archestra
# These define the 5 specialized security agents

# NOTE: The Archestra Terraform provider resource names may need adjustment
# based on the actual provider schema. These serve as the declarative
# configuration reference for manual or API-based agent creation.

# Agent 1: Sentinel - Triage Agent (Cheap, fast model)
# resource "archestra_agent" "sentinel" {
#   name          = "Sentinel"
#   description   = "Security alert triage agent - classifies alerts by severity and routes them"
#   system_prompt = file("${path.module}/prompts/sentinel.md")
#   model         = "gpt-4o-mini"
#   provider      = "openai"
# }

# Agent 2: Sherlock - Investigation Agent (Claude for deep analysis)
# resource "archestra_agent" "sherlock" {
#   name          = "Sherlock"
#   description   = "Security investigation agent - deep forensic analysis with dual LLM quarantine"
#   system_prompt = file("${path.module}/prompts/sherlock.md")
#   model         = "claude-sonnet-4-20250514"
#   provider      = "anthropic"
# }

# Agent 3: Responder - Incident Response Agent (GPT-4o for tool use)
# resource "archestra_agent" "responder" {
#   name          = "Responder"
#   description   = "Incident response agent - executes containment and remediation playbooks"
#   system_prompt = file("${path.module}/prompts/responder.md")
#   model         = "gpt-4o"
#   provider      = "openai"
# }

# Agent 4: Chronicler - Compliance & Reporting Agent (Gemini Flash for cheap reports)
# resource "archestra_agent" "chronicler" {
#   name          = "Chronicler"
#   description   = "Compliance and reporting agent - generates post-incident reports"
#   system_prompt = file("${path.module}/prompts/chronicler.md")
#   model         = "gemini-2.0-flash"
#   provider      = "gemini"
# }

# Agent 5: Overseer - Orchestrator Agent (Claude for coordination)
# resource "archestra_agent" "overseer" {
#   name          = "Overseer"
#   description   = "Security operations orchestrator - coordinates all agents and manages budgets"
#   system_prompt = file("${path.module}/prompts/overseer.md")
#   model         = "claude-sonnet-4-20250514"
#   provider      = "anthropic"
# }

# --- Agent Configuration Reference (for manual creation in Archestra UI) ---

locals {
  agents = {
    sentinel = {
      name          = "Sentinel"
      description   = "Security alert triage agent - classifies incoming alerts by severity (P1-P4) and routes them to the appropriate agent"
      system_prompt = "prompts/sentinel.md"
      model         = "gpt-4o-mini"
      provider      = "openai"
      tools         = ["create_incident", "list_incidents", "get_incident_stats"]
      budget_daily  = 5.00
    }
    sherlock = {
      name          = "Sherlock"
      description   = "Security investigation agent - conducts deep forensic analysis with dual LLM quarantine for malicious content"
      system_prompt = "prompts/sherlock.md"
      model         = "claude-sonnet-4-20250514"
      provider      = "anthropic"
      tools         = ["check_ip", "check_hash", "check_domain", "check_cve", "bulk_check_ips", "get_incident", "add_evidence", "update_incident"]
      budget_daily  = 25.00
      dual_llm      = true
    }
    responder = {
      name          = "Responder"
      description   = "Incident response agent - executes security playbooks and containment actions"
      system_prompt = "prompts/responder.md"
      model         = "gpt-4o"
      provider      = "openai"
      tools         = ["block_ip", "isolate_pod", "revoke_token", "quarantine_user", "execute_playbook", "get_action_log", "update_incident", "add_evidence"]
      budget_daily  = 15.00
    }
    chronicler = {
      name          = "Chronicler"
      description   = "Compliance and reporting agent - generates post-incident reports and checks regulatory obligations"
      system_prompt = "prompts/chronicler.md"
      model         = "gemini-2.0-flash"
      provider      = "gemini"
      tools         = ["get_incident", "update_incident", "add_evidence", "get_incident_stats"]
      budget_daily  = 5.00
    }
    overseer = {
      name          = "Overseer"
      description   = "Security operations orchestrator - coordinates all agents, manages budgets, and handles escalation"
      system_prompt = "prompts/overseer.md"
      model         = "claude-sonnet-4-20250514"
      provider      = "anthropic"
      tools         = ["create_incident", "update_incident", "get_incident", "list_incidents", "get_incident_stats", "check_ip", "block_ip", "execute_playbook"]
      budget_daily  = 30.00
    }
  }
}
