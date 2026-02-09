"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { scenarios, type SimStep } from "@/lib/simulation-scenarios";
import { cn } from "@/lib/utils";
import {
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ShieldX,
  Wrench,
  Clock,
  DollarSign,
  Search,
  AlertTriangle,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ── Agent styling ────────────────────────────── */
const AGENT_STYLE: Record<string, { color: string; bg: string; icon: typeof Shield }> = {
  Sentinel: { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: Shield },
  Sherlock: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: ShieldAlert },
  Responder: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", icon: ShieldCheck },
  Chronicler: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: FileText },
  Overseer: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: ShieldX },
};

const STAGES = ["triage", "investigate", "contain", "report"] as const;
const STAGE_LABELS: Record<string, string> = {
  triage: "Triage",
  investigate: "Investigate",
  contain: "Contain",
  report: "Report",
};
const STAGE_AGENTS: Record<string, string> = {
  triage: "Sentinel",
  investigate: "Sherlock",
  contain: "Responder",
  report: "Chronicler",
};

type SimState = "idle" | "running" | "complete";

export default function SimulatePage() {
  const [selected, setSelected] = useState(0);
  const [simState, setSimState] = useState<SimState>("idle");
  const [visibleSteps, setVisibleSteps] = useState<SimStep[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [currentSeverity, setCurrentSeverity] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalCost = visibleSteps.reduce((sum, s) => sum + s.cost, 0);
  const toolsCalled = visibleSteps.filter((s) => s.toolCall).length;
  const evidenceCount = visibleSteps.filter((s) => s.evidence).length;

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setSimState("idle");
    setVisibleSteps([]);
    setActiveStage(null);
    setCurrentSeverity(null);
    setElapsed(0);
  }, []);

  const startSim = useCallback(() => {
    reset();
    setSimState("running");
    const scenario = scenarios[selected];
    setCurrentSeverity(scenario.severity.split(" ")[0]);

    let totalDelay = 0;
    scenario.steps.forEach((step, i) => {
      totalDelay += step.delay / speed;
      const t = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step]);
        setActiveStage(step.stage);
        if (step.severity) setCurrentSeverity(step.severity);
        if (i === scenario.steps.length - 1) {
          setSimState("complete");
        }
      }, totalDelay);
      timeoutsRef.current.push(t);
    });
  }, [selected, speed, reset]);

  // Elapsed timer
  useEffect(() => {
    if (simState !== "running") return;
    const interval = setInterval(() => setElapsed((p) => p + 100), 100);
    return () => clearInterval(interval);
  }, [simState]);

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [visibleSteps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const scenario = scenarios[selected];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="animate-in delay-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fafaf9" }}>
            Attack Simulation
          </h1>
          {simState === "running" && (
            <span className="flex items-center gap-1.5">
              <span className="led led-red" />
              <span className="text-xs font-mono" style={{ color: "#f87171" }}>
                LIVE
              </span>
            </span>
          )}
          {simState === "complete" && (
            <span className="flex items-center gap-1.5">
              <span className="led led-green" />
              <span className="text-xs font-mono" style={{ color: "#34d399" }}>
                COMPLETE
              </span>
            </span>
          )}
        </div>
        <p className="text-sm mt-0.5" style={{ color: "#5c5c58" }}>
          Watch 5 AI agents respond to a live security incident in real-time
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 animate-in delay-2">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => simState === "idle" && setSelected(i)}
            disabled={simState !== "idle"}
            className={cn(
              "card-glow p-4 text-left transition-all",
              simState !== "idle" && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderLeft: `3px solid ${i === selected ? "#34d399" : "#1a1a1e"}`,
              background: i === selected ? "#111113" : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                className="h-3.5 w-3.5"
                style={{ color: i === selected ? "#f87171" : "#3a3a37" }}
              />
              <span className="text-sm font-bold" style={{ color: i === selected ? "#fafaf9" : "#5c5c58" }}>
                {s.title}
              </span>
            </div>
            <p className="text-[11px] mb-2" style={{ color: "#3a3a37" }}>
              {s.subtitle}
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "#19191c", color: "#f87171" }}
              >
                {s.severity}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "#19191c", color: "#5c5c58" }}
              >
                {s.mitre.split(",")[0]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 animate-in delay-3">
        {simState === "idle" ? (
          <button
            onClick={startSim}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
            style={{ background: "#34d399", color: "#050505" }}
          >
            <Play className="h-4 w-4" />
            Run Simulation
          </button>
        ) : (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all"
            style={{ background: "#19191c", color: "#8a8a86", border: "1px solid #252529" }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
        <div className="flex items-center gap-1">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => simState === "idle" && setSpeed(s)}
              className="px-2.5 py-1 rounded text-[11px] font-mono transition-all"
              style={{
                background: speed === s ? "#252529" : "transparent",
                color: speed === s ? "#fafaf9" : "#3a3a37",
              }}
            >
              {s}x
            </button>
          ))}
        </div>
        {simState !== "idle" && (
          <span className="text-xs font-mono ml-auto" style={{ color: "#5c5c58" }}>
            {(elapsed / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Pipeline Progress */}
      {simState !== "idle" && (
        <div className="card-glow p-4">
          <div className="flex items-center justify-between">
            {STAGES.map((stage, i) => {
              const agent = STAGE_AGENTS[stage];
              const style = AGENT_STYLE[agent];
              const completedStages = visibleSteps.map((s) => s.stage);
              const isComplete =
                completedStages.includes(stage) && activeStage !== stage &&
                STAGES.indexOf(stage) < STAGES.indexOf((activeStage || "triage") as typeof STAGES[number]);
              const isActive = activeStage === stage;
              const isPending = !isComplete && !isActive;

              return (
                <div key={stage} className="flex items-center" style={{ flex: i < STAGES.length - 1 ? 1 : undefined }}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor: isComplete ? style.color : isActive ? style.color : "#252529",
                        background: isComplete ? style.bg : isActive ? style.bg : "#111113",
                        boxShadow: isActive ? `0 0 0 2px #0a0a0b, 0 0 0 4px ${style.color}` : undefined,
                      }}
                    >
                      <style.icon
                        className="h-4 w-4"
                        style={{ color: isPending ? "#3a3a37" : style.color }}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold" style={{ color: isPending ? "#3a3a37" : "#fafaf9" }}>
                        {STAGE_LABELS[stage]}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: isPending ? "#252529" : style.color }}>
                        {agent}
                      </div>
                    </div>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="flex-1 mx-3">
                      <div className="h-px" style={{ background: isComplete ? style.color : "#252529" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      {simState !== "idle" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Event Feed */}
          <div className="xl:col-span-2">
            <h2 className="section-label mb-3">Agent Activity</h2>
            <div
              ref={feedRef}
              className="space-y-1.5 overflow-y-auto pr-1"
              style={{ maxHeight: "calc(100vh - 520px)", minHeight: 400 }}
            >
              {visibleSteps.map((step, i) => (
                <EventEntry key={step.id} step={step} index={i} />
              ))}
              {simState === "running" && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#111113" }}>
                  <div className="led led-amber" />
                  <span className="text-xs font-mono" style={{ color: "#5c5c58" }}>
                    Waiting for next agent action...
                  </span>
                </div>
              )}
              {simState === "complete" && <SummaryCard elapsed={elapsed} cost={totalCost} tools={toolsCalled} evidence={evidenceCount} />}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Scenario Info */}
            <div className="card-glow p-4" style={{ borderLeft: "3px solid #f87171" }}>
              <h3 className="section-label mb-2">Scenario</h3>
              <p className="text-sm font-bold mb-1" style={{ color: "#fafaf9" }}>{scenario.title}</p>
              <p className="text-[11px] mb-2" style={{ color: "#5c5c58" }}>{scenario.trigger}</p>
              <div className="flex flex-wrap gap-1">
                {scenario.mitre.split(", ").map((t) => (
                  <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#19191c", color: "#5c5c58" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Metrics */}
            <div className="card-glow p-4">
              <h3 className="section-label mb-3">Live Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                <MetricBox icon={Clock} label="Elapsed" value={`${(elapsed / 1000).toFixed(1)}s`} color="#fafaf9" />
                <MetricBox icon={Wrench} label="Tool Calls" value={String(toolsCalled)} color="#fb923c" />
                <MetricBox icon={Search} label="Evidence" value={String(evidenceCount)} color="#60a5fa" />
                <MetricBox icon={DollarSign} label="Cost" value={`$${totalCost.toFixed(3)}`} color="#34d399" />
                <MetricBox icon={AlertTriangle} label="Severity" value={currentSeverity || "—"} color={currentSeverity === "P1" ? "#f87171" : "#fb923c"} />
                <MetricBox icon={Zap} label="Agents" value={`${new Set(visibleSteps.map((s) => s.agent)).size}/5`} color="#a78bfa" />
              </div>
            </div>

            {/* Evidence Collected */}
            {visibleSteps.some((s) => s.evidence) && (
              <div className="card-glow p-4">
                <h3 className="section-label mb-3">Evidence Collected</h3>
                <div className="space-y-1.5">
                  {visibleSteps
                    .filter((s) => s.evidence)
                    .map((s) => (
                      <div key={s.id} className="rounded-lg p-2.5" style={{ background: "#19191c" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                            {s.evidence!.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono break-all" style={{ color: "#d4d4d0" }}>
                          {s.evidence!.value}
                        </p>
                        {s.evidence!.threatScore && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="threat-bar flex-1">
                              <div
                                className="threat-fill"
                                style={{
                                  width: `${s.evidence!.threatScore}%`,
                                  background: s.evidence!.threatScore > 80 ? "#f87171" : "#fbbf24",
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold" style={{ color: s.evidence!.threatScore > 80 ? "#f87171" : "#fbbf24" }}>
                              {s.evidence!.threatScore}/100
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Idle state - show scenario preview */}
      {simState === "idle" && (
        <div className="card-glow p-8 text-center animate-in delay-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Play className="h-5 w-5" style={{ color: "#34d399" }} />
            <span className="text-sm font-bold" style={{ color: "#fafaf9" }}>
              Select a scenario and click Run Simulation
            </span>
          </div>
          <p className="text-xs max-w-lg mx-auto" style={{ color: "#3a3a37" }}>
            Watch Sentinel triage the alert, Sherlock investigate with threat intel,
            Responder execute containment via playbooks, and Chronicler generate the compliance report.
            All tool calls are shown in real-time.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────── */

function EventEntry({ step, index }: { step: SimStep; index: number }) {
  const agent = AGENT_STYLE[step.agent];
  const timestamp = new Date();
  timestamp.setMinutes(timestamp.getMinutes() - 5);
  timestamp.setSeconds(timestamp.getSeconds() + index * 2);

  const ts = timestamp.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="card-glow p-4 animate-in" style={{ borderLeft: `3px solid ${agent.color}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center"
            style={{ background: agent.bg }}
          >
            <agent.icon className="h-3 w-3" style={{ color: agent.color }} />
          </div>
          <span className="text-xs font-bold" style={{ color: agent.color }}>
            {step.agent}
          </span>
          <ChevronRight className="h-3 w-3" style={{ color: "#252529" }} />
          <span className="text-sm font-medium" style={{ color: "#d4d4d0" }}>
            {step.action}
          </span>
          {step.severity && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{
                background: step.severity === "P1" ? "rgba(248,113,113,0.15)" : "rgba(251,146,60,0.15)",
                color: step.severity === "P1" ? "#f87171" : "#fb923c",
              }}
            >
              {step.severity}
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono" style={{ color: "#3a3a37" }}>
          {ts}
        </span>
      </div>

      {step.details && (
        <p className="text-xs leading-relaxed ml-8" style={{ color: "#5c5c58" }}>
          {step.details}
        </p>
      )}

      {step.toolCall && (
        <div className="ml-8 mt-2 rounded-lg p-3" style={{ background: "#0e0e10", border: "1px solid #1a1a1e" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Wrench className="h-3 w-3" style={{ color: "#3a3a37" }} />
            <span className="text-[10px] font-mono" style={{ color: "#8a8a86" }}>
              {step.toolCall.server}
            </span>
            <span style={{ color: "#252529" }}>/</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: "#34d399" }}>
              {step.toolCall.name}()
            </span>
          </div>
          <div className="text-[10px] font-mono mb-1.5" style={{ color: "#3a3a37" }}>
            {Object.entries(step.toolCall.params).map(([k, v]) => (
              <span key={k} className="mr-3">
                <span style={{ color: "#5c5c58" }}>{k}</span>
                <span style={{ color: "#252529" }}>=</span>
                <span style={{ color: "#8a8a86" }}>&quot;{v}&quot;</span>
              </span>
            ))}
          </div>
          <div className="text-[11px] leading-relaxed" style={{ color: "#d4d4d0" }}>
            <span style={{ color: "#3a3a37" }}>→ </span>
            {step.toolCall.result}
          </div>
        </div>
      )}

      {step.cost > 0 && (
        <div className="ml-8 mt-1.5">
          <span className="text-[9px] font-mono" style={{ color: "#3a3a37" }}>
            cost: ${step.cost.toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
      <Icon className="h-3 w-3 mx-auto mb-1" style={{ color: "#3a3a37" }} />
      <div className="text-sm font-mono font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
        {label}
      </div>
    </div>
  );
}

function SummaryCard({ elapsed, cost, tools, evidence }: { elapsed: number; cost: number; tools: number; evidence: number }) {
  return (
    <div
      className="card-glow p-5 mt-2"
      style={{ borderLeft: "3px solid #34d399", background: "rgba(52,211,153,0.03)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-5 w-5" style={{ color: "#34d399" }} />
        <span className="text-sm font-bold" style={{ color: "#34d399" }}>
          Simulation Complete
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fafaf9" }}>
            {(elapsed / 1000).toFixed(1)}s
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>MTTR</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fafaf9" }}>
            {tools}
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>Tool Calls</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fafaf9" }}>
            {evidence}
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>Evidence</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#34d399" }}>
            ${cost.toFixed(2)}
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>Total Cost</div>
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: "#5c5c58" }}>
        Full incident lifecycle handled autonomously. From alert to closure with investigation,
        containment, and compliance — no human intervention required.
      </p>
    </div>
  );
}
