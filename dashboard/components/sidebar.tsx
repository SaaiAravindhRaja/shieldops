"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/simulate", label: "Simulate", icon: Play },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-200"
      style={{
        width: collapsed ? 64 : 224,
        background: "#0a0a0b",
        borderRight: "1px solid #1a1a1e",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ height: 56, borderBottom: "1px solid #1a1a1e" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(52, 211, 153, 0.1)" }}
        >
          <Shield className="h-4 w-4" style={{ color: "#34d399" }} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1
              className="text-sm font-bold tracking-tight"
              style={{ color: "#fafaf9" }}
            >
              ShieldOps
            </h1>
            <p
              className="text-[10px] tracking-wider uppercase"
              style={{
                color: "#5c5c58",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              SOC Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {!collapsed && (
          <div
            className="px-3 mb-3"
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "#3a3a37",
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            Navigation
          </div>
        )}
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              style={collapsed ? { justifyContent: "center", padding: "8px" } : undefined}
            >
              <item.icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? "#fafaf9" : "#5c5c58" }}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div
          className="mx-3 mb-3 rounded-lg p-3"
          style={{
            background: "#111113",
            border: "1px solid #1a1a1e",
          }}
        >
          <div
            className="mb-2"
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "#3a3a37",
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            System
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="led led-green" />
              <span style={{ fontSize: 11, color: "#8a8a86" }}>
                Archestra Connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="led led-green" />
              <span style={{ fontSize: 11, color: "#8a8a86" }}>
                5 Agents Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="led led-green" />
              <span style={{ fontSize: 11, color: "#8a8a86" }}>
                3 MCP Servers
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Version */}
      {!collapsed && (
        <div
          className="px-4 pb-2"
          style={{
            fontSize: 10,
            color: "#3a3a37",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          v1.0.0 — Archestra Platform
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center transition-colors"
        style={{
          height: 40,
          borderTop: "1px solid #1a1a1e",
          color: "#5c5c58",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8a86")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#5c5c58")}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
