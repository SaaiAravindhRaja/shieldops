terraform {
  required_providers {
    archestra = {
      source  = "archestra-ai/archestra"
      version = "~> 0.1"
    }
  }
}

provider "archestra" {
  base_url = var.archestra_url
  api_key  = var.archestra_api_key
}
