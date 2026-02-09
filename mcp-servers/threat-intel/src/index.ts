#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || "";
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY || "";

const server = new McpServer({
  name: "shieldops-threat-intel",
  version: "1.0.0",
});

// Tool: Check IP Reputation (AbuseIPDB)
server.tool(
  "check_ip",
  "Check an IP address against AbuseIPDB for abuse reports and reputation score",
  {
    ip: z.string().describe("IPv4 or IPv6 address to check"),
    max_age_days: z
      .number()
      .optional()
      .default(90)
      .describe("Max age of reports to consider (days)"),
  },
  async ({ ip, max_age_days }) => {
    if (!ABUSEIPDB_API_KEY) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ip,
              abuse_confidence_score: 0,
              total_reports: 0,
              warning: "ABUSEIPDB_API_KEY not set - using mock data",
              is_whitelisted: false,
              country_code: "US",
              isp: "Unknown ISP",
              domain: "unknown.com",
              last_reported_at: null,
            }),
          },
        ],
      };
    }

    const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=${max_age_days}`;
    const response = await fetch(url, {
      headers: {
        Key: ABUSEIPDB_API_KEY,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              ip,
              abuse_confidence_score: data.data?.abuseConfidenceScore ?? 0,
              total_reports: data.data?.totalReports ?? 0,
              is_whitelisted: data.data?.isWhitelisted ?? false,
              country_code: data.data?.countryCode ?? "Unknown",
              isp: data.data?.isp ?? "Unknown",
              domain: data.data?.domain ?? "Unknown",
              last_reported_at: data.data?.lastReportedAt ?? null,
              usage_type: data.data?.usageType ?? "Unknown",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Check File Hash (VirusTotal)
server.tool(
  "check_hash",
  "Check a file hash (MD5, SHA1, or SHA256) against VirusTotal for malware detection",
  {
    hash: z.string().describe("File hash (MD5, SHA1, or SHA256)"),
  },
  async ({ hash }) => {
    if (!VIRUSTOTAL_API_KEY) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              hash,
              malicious: 0,
              suspicious: 0,
              undetected: 0,
              harmless: 0,
              warning: "VIRUSTOTAL_API_KEY not set - using mock data",
              verdict: "unknown",
            }),
          },
        ],
      };
    }

    const url = `https://www.virustotal.com/api/v3/files/${hash}`;
    const response = await fetch(url, {
      headers: { "x-apikey": VIRUSTOTAL_API_KEY },
    });

    if (response.status === 404) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              hash,
              verdict: "not_found",
              message: "Hash not found in VirusTotal database",
            }),
          },
        ],
      };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              hash,
              malicious: stats.malicious || 0,
              suspicious: stats.suspicious || 0,
              undetected: stats.undetected || 0,
              harmless: stats.harmless || 0,
              verdict:
                stats.malicious > 0
                  ? "malicious"
                  : stats.suspicious > 0
                    ? "suspicious"
                    : "clean",
              file_type: data.data?.attributes?.type_description || "Unknown",
              file_name:
                data.data?.attributes?.meaningful_name || "Unknown",
              sha256: data.data?.attributes?.sha256 || hash,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Check Domain Reputation (VirusTotal)
server.tool(
  "check_domain",
  "Check a domain against VirusTotal for reputation and threat information",
  {
    domain: z.string().describe("Domain name to check (e.g., evil-site.com)"),
  },
  async ({ domain }) => {
    if (!VIRUSTOTAL_API_KEY) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              domain,
              malicious: 0,
              suspicious: 0,
              warning: "VIRUSTOTAL_API_KEY not set - using mock data",
              verdict: "unknown",
              categories: {},
            }),
          },
        ],
      };
    }

    const url = `https://www.virustotal.com/api/v3/domains/${domain}`;
    const response = await fetch(url, {
      headers: { "x-apikey": VIRUSTOTAL_API_KEY },
    });

    if (response.status === 404) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              domain,
              verdict: "not_found",
              message: "Domain not found in VirusTotal database",
            }),
          },
        ],
      };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              domain,
              malicious: stats.malicious || 0,
              suspicious: stats.suspicious || 0,
              harmless: stats.harmless || 0,
              undetected: stats.undetected || 0,
              verdict:
                stats.malicious > 0
                  ? "malicious"
                  : stats.suspicious > 0
                    ? "suspicious"
                    : "clean",
              categories: data.data?.attributes?.categories || {},
              registrar: data.data?.attributes?.registrar || "Unknown",
              creation_date: data.data?.attributes?.creation_date || null,
              reputation: data.data?.attributes?.reputation || 0,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Check CVE (NVD - National Vulnerability Database)
server.tool(
  "check_cve",
  "Look up a CVE (Common Vulnerabilities and Exposures) ID in the National Vulnerability Database",
  {
    cve_id: z
      .string()
      .describe("CVE identifier (e.g., CVE-2024-1234)"),
  },
  async ({ cve_id }) => {
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cve_id)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    const data = await response.json();
    const vuln = data.vulnerabilities?.[0]?.cve;

    if (!vuln) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              cve_id,
              found: false,
              message: "CVE not found in NVD",
            }),
          },
        ],
      };
    }

    const metrics =
      vuln.metrics?.cvssMetricV31?.[0] || vuln.metrics?.cvssMetricV2?.[0];

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              cve_id: vuln.id,
              found: true,
              description:
                vuln.descriptions?.find(
                  (d: { lang: string }) => d.lang === "en"
                )?.value || "No description",
              cvss_score: metrics?.cvssData?.baseScore || null,
              cvss_severity: metrics?.cvssData?.baseSeverity || "Unknown",
              attack_vector: metrics?.cvssData?.attackVector || "Unknown",
              published: vuln.published || null,
              last_modified: vuln.lastModified || null,
              references:
                vuln.references?.slice(0, 5).map(
                  (r: { url: string; source: string }) => ({
                    url: r.url,
                    source: r.source,
                  })
                ) || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Bulk IP Check
server.tool(
  "bulk_check_ips",
  "Check multiple IP addresses against threat intelligence feeds and return a summary",
  {
    ips: z
      .array(z.string())
      .max(10)
      .describe("List of IP addresses to check (max 10)"),
  },
  async ({ ips }) => {
    const results = await Promise.all(
      ips.map(async (ip) => {
        if (!ABUSEIPDB_API_KEY) {
          return {
            ip,
            abuse_confidence_score: Math.floor(Math.random() * 100),
            total_reports: Math.floor(Math.random() * 50),
            mock: true,
          };
        }
        try {
          const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
          const response = await fetch(url, {
            headers: { Key: ABUSEIPDB_API_KEY, Accept: "application/json" },
          });
          const data = await response.json();
          return {
            ip,
            abuse_confidence_score: data.data?.abuseConfidenceScore ?? 0,
            total_reports: data.data?.totalReports ?? 0,
            country_code: data.data?.countryCode ?? "Unknown",
          };
        } catch {
          return { ip, error: "Failed to check", abuse_confidence_score: -1 };
        }
      })
    );

    const malicious = results.filter(
      (r) => r.abuse_confidence_score > 50
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              total_checked: results.length,
              malicious_count: malicious.length,
              results,
              summary:
                malicious.length > 0
                  ? `${malicious.length} of ${results.length} IPs flagged as potentially malicious`
                  : "No malicious IPs detected",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ShieldOps Threat Intel MCP server running");
}

main().catch(console.error);
