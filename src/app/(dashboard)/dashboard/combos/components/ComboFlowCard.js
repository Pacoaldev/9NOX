"use client";

import { useMemo } from "react";
import { matchMemberRow, parseMember, sameProvider } from "./comboMatch";

const RECENT_WINDOW_MS = 25000;

const PALETTE = ["#22d3ee", "#a78bfa", "#f472b6", "#facc15", "#34d399", "#fb923c", "#60a5fa", "#f87171"];

/** Stable colour per provider, so a member keeps its identity between renders. */
function colorFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return PALETTE[h % PALETTE.length];
}

/** 820 -> "820ms", 1240 -> "1.2s", 13400 -> "13s". */
function fmtLatency(ms) {
  if (!ms || ms <= 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return ms >= 10000 ? `${Math.round(ms / 1000)}s` : `${(ms / 1000).toFixed(1)}s`;
}

function initials(name) {
  const s = String(name || "").replace(/[^A-Za-z0-9]/g, " ").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : s.slice(0, 2)).toUpperCase();
}

function normCombo(name) {
  return String(name || "").toLowerCase().trim();
}

const KIND_STYLE = {
  trying: { chip: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  connected: { chip: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  failed: { chip: "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/30", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  idle: { chip: "bg-black/5 text-text-muted border-transparent dark:bg-white/5", text: "text-text-muted", dot: "bg-zinc-400 dark:bg-zinc-600" },
};

const ROW_BORDER = {
  trying: "border-amber-500/40 ring-1 ring-amber-500/20",
  connected: "border-emerald-500/40 ring-1 ring-emerald-500/15",
  failed: "border-red-500/30",
  idle: "border-black/5 dark:border-white/10",
};

const ICON = { connected: "check_circle", failed: "cancel", trying: "progress_activity", idle: "radio_button_unchecked" };

/**
 * Combo Flow — numbered members of the combo in use, with per-member status
 * (trying / answered / failed / not used yet), latency and failover hints.
 *
 * Ported from 9router-go's ComboFlowCard.svelte.
 */
export default function ComboFlowCard({ combos = [], activeRequests = [], recentRequests = [], errorProvider = "" }) {
  const steps = useMemo(() => {
    const liveFromActive = activeRequests.find((r) => r.comboName)?.comboName;
    let liveCombo = liveFromActive || "";
    if (!liveCombo) {
      const cutoff = Date.now() - RECENT_WINDOW_MS;
      for (const r of recentRequests) {
        if (!r.comboName) continue;
        const t = Date.parse(r.timestamp || "");
        if (Number.isNaN(t) || t >= cutoff) {
          liveCombo = r.comboName;
          break;
        }
      }
    }
    if (!liveCombo) return { liveCombo: "", steps: [], strategy: "" };

    const definition = (combos || []).find((c) => normCombo(c?.name) === normCombo(liveCombo));
    if (!definition || !Array.isArray(definition.members) || definition.members.length === 0) {
      return { liveCombo: "", steps: [], strategy: "" };
    }

    const combo = normCombo(liveCombo);
    const active = activeRequests.filter((r) => normCombo(r.comboName) === combo);
    const recent = recentRequests.filter((r) => normCombo(r.comboName) === combo);
    const memberProviders = definition.members.map((raw) => parseMember(raw).provider).filter(Boolean);

    const built = definition.members.map((raw) => {
      const { provider, model } = parseMember(raw);
      const inFlight = matchMemberRow(active, provider, model, memberProviders);
      const finished = matchMemberRow(recent, provider, model, memberProviders);
      const finishedStatus = String(finished?.status || "");
      const latency = Number(finished?.latencyMs || 0);
      const resolved = String(inFlight?.provider || finished?.provider || provider);
      const refused = sameProvider(errorProvider, resolved) || sameProvider(errorProvider, provider);

      let status = "idle";
      let note = "not used yet";
      if (inFlight) {
        status = "trying";
        note = "trying";
      } else if (finished && finishedStatus.toLowerCase() === "ok") {
        status = "connected";
        note = "answered";
      } else if (refused) {
        status = "failed";
        note = "failed";
      } else if (finished) {
        status = "failed";
        note = finishedStatus || "failed";
      }
      return { key: raw, provider, model, status, note, color: colorFor(provider), latency };
    });

    const strategy = String(definition.strategy || "").trim() || "fallback";
    return { liveCombo, steps: built, strategy };
  }, [combos, activeRequests, recentRequests, errorProvider]);

  const { liveCombo, strategy } = steps;
  const list = steps.steps;

  if (!liveCombo || list.length === 0) return null;

  const counts = {
    trying: list.filter((s) => s.status === "trying").length,
    connected: list.filter((s) => s.status === "connected").length,
    failed: list.filter((s) => s.status === "failed").length,
    idle: list.filter((s) => s.status === "idle").length,
  };
  const routeState = counts.failed > 0 ? "failed" : counts.connected > 0 ? "connected" : counts.trying > 0 ? "trying" : "idle";
  const answeredIndex = list.findIndex((s) => s.status === "connected");

  return (
    <section
      className="bg-surface border border-border-subtle rounded-[14px] min-w-0 overflow-hidden"
      aria-label="Combo flow"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Combo flow</span>
          <span className="truncate text-sm font-semibold text-text-main">{liveCombo}</span>
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
            {strategy}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {counts.trying > 0 && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE.trying.chip}`}>
              {counts.trying} trying
            </span>
          )}
          {counts.connected > 0 && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE.connected.chip}`}>
              {counts.connected} answered
            </span>
          )}
          {counts.failed > 0 && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE.failed.chip}`}>
              {counts.failed} failed
            </span>
          )}
          {counts.idle > 0 && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE.idle.chip}`}>
              {counts.idle} remaining
            </span>
          )}
        </div>
      </header>

      {/* the route: gateway into the combo, one hop */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-black/[0.02] px-2.5 py-1.5 dark:bg-white/[0.03]">
          <span className={`h-2 w-2 rounded-full ${KIND_STYLE[routeState].dot}`} />
          <span className="text-xs font-medium text-text-main">9router</span>
        </div>
        <span className={`flex-1 border-t border-dashed ${routeState === "failed" ? "border-red-500/50" : routeState === "connected" ? "border-emerald-500/50" : routeState === "trying" ? "border-amber-500/50" : "border-border-subtle"}`} />
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-black/[0.02] px-2.5 py-1.5 dark:bg-white/[0.03]">
          <span className="material-symbols-outlined text-[18px] text-primary">account_tree</span>
          <span className="flex flex-col leading-tight">
            <strong className="text-xs font-semibold text-text-main">{liveCombo}</strong>
            <small className="text-[10px] text-text-muted">
              {strategy} · {list.length} members
            </small>
          </span>
        </div>
      </div>

      {/* the members, in the combo's own order, numbered so the order is explicit */}
      <ol className="flex flex-col gap-1.5 px-4 py-3">
        {list.map((step, i) => {
          const used = answeredIndex < 0 || i <= answeredIndex;
          return (
            <li key={step.key} className={`flex items-start gap-2 ${used ? "" : "opacity-55"}`}>
              <span
                className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-black/[0.02] text-[11px] font-semibold tabular-nums text-text-muted dark:bg-white/[0.03]"
                aria-hidden="true"
              >
                {i + 1}
              </span>

              <div className={`flex-1 overflow-hidden rounded-lg border bg-black/[0.015] dark:bg-white/[0.02] ${ROW_BORDER[step.status]}`}>
                <div className="flex items-center gap-2.5 px-2.5 py-1.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ backgroundColor: step.color }}
                  >
                    {initials(step.provider)}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <strong className="truncate text-xs font-semibold text-text-main">{step.provider}</strong>
                    <small className="truncate text-[10px] text-text-muted" title={step.model || step.provider}>
                      {step.model || "—"}
                    </small>
                  </span>

                  <span className="ml-auto flex items-center gap-2">
                    {step.latency > 0 && (
                      <span className="text-[11px] tabular-nums text-text-muted" title="time this member took to answer">
                        {fmtLatency(step.latency)}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide ${KIND_STYLE[step.status].text}`}>
                      <span className={`material-symbols-outlined text-[15px] ${step.status === "trying" ? "animate-spin" : ""}`}>
                        {ICON[step.status]}
                      </span>
                      {step.note}
                    </span>
                  </span>
                </div>

                {step.status === "failed" && list[i + 1] && (
                  <p className="flex items-center gap-1 border-t border-red-500/20 px-2.5 py-1 text-[10px] text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-[13px]">south</span>
                    failed, moving to #{i + 2} {list[i + 1].provider}
                  </p>
                )}
                {step.status === "connected" && (
                  <p className="flex items-center gap-1 border-t border-emerald-500/20 px-2.5 py-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    served here — member #{i + 2} and beyond are unused
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border-subtle px-4 py-2 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE.trying.dot}`} /> trying
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE.connected.dot}`} /> answered
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE.failed.dot}`} /> failed → moves to the next one
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE.idle.dot}`} /> not used yet
        </span>
      </footer>
    </section>
  );
}
