variable "archestra_url" {
  description = "Archestra API base URL"
  type        = string
  default     = "http://localhost:9000"
}

variable "archestra_api_key" {
  description = "Archestra API key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for GPT-4o and GPT-4o-mini"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude Sonnet"
  type        = string
  sensitive   = true
}

variable "google_ai_api_key" {
  description = "Google AI API key for Gemini Flash"
  type        = string
  sensitive   = true
}
