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

variable "google_ai_api_key" {
  description = "Google AI API key for Gemini (free tier — no credit card required)"
  type        = string
  sensitive   = true
}
