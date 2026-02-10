"use client";

import { costByDay, incidentsByDay, mttrByDay } from "@/lib/mock-data";
import { useAgents, useStats } from "@/lib/use-data";
import { formatCost, cn, AGENT_COLORS, SEVERITY_COLORS } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DollarSign, TrendingDown, Target, ShieldCheck } from "lucide-react";

const defaultPieData = [
  { name: "Sentinel", value: 42, color: AGENT_COLORS.sentinel },
  { name: "Sherlock", value: 1280, color: AGENT_COLORS.sherlock },
  { name: "Responder", value: 680, color: AGENT_COLORS.responder },
  { name: "Chronicler", value: 28, color: AGENT_COLORS.chronicler },
  { name: "Overseer", value: 950, color: AGENT_COLORS.overseer },
];

function ChartCard({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) {
  return (
    <div className={cn("card-glow p-5 animate-in", `delay-${delay}`)}>
      <h3 className="section-label mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, accent, delay }: {
  title: string; value: string; subtitle: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent: string; delay: number;
}) {
  return (
    <div
      className={cn("card-glow p-4 animate-in", `delay-${delay}`)}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="h-8 w-8 rounded-md flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <span className="section-label">{title}</span>
      </div>
      <div className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: "#fafaf9" }}>
        {value}
      </div>
      <p className="text-[10px] mt-0.5" style={{ color: "#3a3a37" }}>{subtitle}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-lg p-3 shadow-xl"
      style={{ background: "#19191c", border: "1px solid #252529" }}
    >
      <p className="text-xs font-mono mb-1" style={{ color: "#5c5c58" }}>{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span style={{ color: "#5c5c58" }}>{item.name}:</span>
          <span className="font-mono" style={{ color: "#d4d4d0" }}>
            {typeof item.value === "number" && item.name !== "mttr" ? formatCost(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MetricsPage() {
  const { data: agents } = useAgents();
  const { data: stats } = useStats();
  const pieData = agents.map?.((a: { name: string; id: string; cost_today: number }) => ({
    name: a.name,
    value: a.cost_today,
    color: AGENT_COLORS[a.id],
  })) || defaultPieData;

  return (
    <div className="space-y-5">
      <div className="animate-in delay-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fafaf9" }}>
          Observability & Metrics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#5c5c58" }}>
          Cost tracking, performance, and detection analytics
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Cost" value={formatCost(stats.totalCost)} subtitle="This week (all agents)" icon={DollarSign} accent="#fbbf24" delay={1} />
        <MetricCard title="Avg MTTR" value={`${stats.avgMttr}m`} subtitle="18% improvement" icon={TrendingDown} accent="#34d399" delay={2} />
        <MetricCard title="Detection Rate" value="94.2%" subtitle="True positive rate" icon={Target} accent="#60a5fa" delay={3} />
        <MetricCard title="Threats Blocked" value={`${stats.threatsBlocked}`} subtitle="IPs, domains, tokens" icon={ShieldCheck} accent="#34d399" delay={4} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <ChartCard title="Agent Cost Over Time" delay={5}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                <XAxis dataKey="date" tick={{ fill: "#3a3a37", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCost(v)} tick={{ fill: "#3a3a37", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(AGENT_COLORS).map(([key, color]) => (
                  <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={color} fill={color} fillOpacity={0.12} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cost by Agent" delay={5}>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value: string) => <span className="text-xs" style={{ color: "#5c5c58" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="MTTR Trend (minutes)" delay={6}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mttrByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                <XAxis dataKey="date" tick={{ fill: "#3a3a37", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#3a3a37", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mttr" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <ChartCard title="Incidents by Severity" delay={7}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                <XAxis dataKey="date" tick={{ fill: "#3a3a37", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#3a3a37", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={color} radius={key === "P4" ? [3, 3, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cost: Commercial vs ShieldOps" delay={8}>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: "#5c5c58" }}>Commercial SOC (GPT-4o + Claude)</span>
                <span className="text-xs font-mono" style={{ color: "#5c5c58" }}>$320/day</span>
              </div>
              <div className="gauge-track" style={{ height: 8 }}>
                <div className="gauge-fill" style={{ width: "100%", background: "#f8717140" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: "#d4d4d0" }}>ShieldOps — Gemini Free Tier</span>
                <span className="text-xs font-mono" style={{ color: "#34d399" }}>$0/day</span>
              </div>
              <div className="gauge-track" style={{ height: 8 }}>
                <div className="gauge-fill" style={{ width: "2%", background: "#34d399" }} />
              </div>
            </div>
            <div
              className="card-glow p-4 mt-4 flex items-center justify-between"
              style={{ borderLeft: "3px solid #34d399" }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: "#34d399" }}>100% Cost Reduction</p>
                <p className="text-[10px]" style={{ color: "#3a3a37" }}>Google Gemini free tier — no credit card</p>
              </div>
              <span className="text-2xl font-mono font-extrabold tabular-nums" style={{ color: "#34d399" }}>
                $0
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
                <p className="text-xs font-mono font-bold" style={{ color: "#34d399" }}>Free</p>
                <p className="text-[9px]" style={{ color: "#3a3a37" }}>Gemini 2.5 Flash</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
                <p className="text-xs font-mono font-bold" style={{ color: "#34d399" }}>Free</p>
                <p className="text-[9px]" style={{ color: "#3a3a37" }}>Gemini 2.5 Pro</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
                <p className="text-xs font-mono font-bold" style={{ color: "#5c5c58" }}>15 RPM</p>
                <p className="text-[9px]" style={{ color: "#3a3a37" }}>Rate limit</p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
