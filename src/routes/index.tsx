import { createFileRoute } from "@tanstack/react-router";
import { Bell, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

type Priority = "HIGH" | "MED" | "LOW";
type Status = "In Progress" | "Pending";

interface Task {
  title: string;
  category: string;
  estimate: string;
  date: string;
  timeLeft: string;
  priority: Priority;
  score: number;
  risk: number;
  slot: string;
  status: Status;
}

const tasks: Task[] = [
  {
    title: "Submit MCA project report",
    category: "Study",
    estimate: "4h",
    date: "Apr 25",
    timeLeft: "6h left",
    priority: "HIGH",
    score: 91,
    risk: 78,
    slot: "Today 14:00",
    status: "In Progress",
  },
  {
    title: "Prepare viva presentation",
    category: "Study",
    estimate: "3h",
    date: "Apr 26",
    timeLeft: "1d left",
    priority: "HIGH",
    score: 87,
    risk: 42,
    slot: "Tomorrow 10:00",
    status: "Pending",
  },
  {
    title: "Review literature chapter",
    category: "Work",
    estimate: "2h",
    date: "Apr 27",
    timeLeft: "2d left",
    priority: "MED",
    score: 64,
    risk: 28,
    slot: "Tomorrow 16:00",
    status: "Pending",
  },
  {
    title: "Update resume",
    category: "Personal",
    estimate: "3h",
    date: "Apr 30",
    timeLeft: "5d left",
    priority: "LOW",
    score: 32,
    risk: 12,
    slot: "Sat 11:00",
    status: "Pending",
  },
];

const tabs = ["All tasks", "High priority", "At risk", "Today"] as const;

function PriorityPill({ priority, score }: { priority: Priority; score: number }) {
  const styles: Record<Priority, string> = {
    HIGH: "bg-[var(--priority-high-bg)] text-[var(--priority-high-fg)]",
    MED: "bg-[var(--priority-med-bg)] text-[var(--priority-med-fg)]",
    LOW: "bg-[var(--priority-low-bg)] text-[var(--priority-low-fg)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        styles[priority],
      )}
    >
      <span>{priority}</span>
      <span className="opacity-60">·</span>
      <span className="tabular-nums">{score}</span>
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    "In Progress": "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]",
    Pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "In Progress" ? "bg-current animate-pulse" : "bg-current opacity-50",
        )}
      />
      {status}
    </span>
  );
}

function RiskBar({ value }: { value: number }) {
  const color =
    value >= 60
      ? "bg-[var(--priority-high-fg)]"
      : value >= 30
        ? "bg-[var(--priority-med-fg)]"
        : "bg-[var(--priority-low-fg)]";
  return (
    <div className="flex items-center gap-2.5 min-w-[88px]">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-foreground/70 w-9 text-right">{value}%</span>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              I
            </div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              ITMS <span className="text-muted-foreground font-normal">— Task Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="hidden md:inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary transition">
              <Search className="h-3.5 w-3.5" />
              <span>Search…</span>
              <kbd className="ml-2 rounded bg-background px-1.5 py-0.5 text-[10px] border border-border">⌘K</kbd>
            </button>

            <button className="relative rounded-lg p-2 hover:bg-secondary transition" aria-label="Notifications">
              <Bell className="h-4.5 w-4.5 text-foreground/70" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--priority-high-fg)] px-1 text-[10px] font-bold text-white">
                2
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 rounded-lg pl-2 pr-3 py-1 hover:bg-secondary transition cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.65_0.18_290)] text-xs font-semibold text-primary-foreground">
                TS
              </div>
              <span className="text-sm font-medium">Tanishka Sharma</span>
            </div>

            <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background hover:opacity-90 transition shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <nav className="flex items-center gap-1 -mb-px">
            {tabs.map((tab, i) => {
              const active = i === 0;
              return (
                <button
                  key={tab}
                  className={cn(
                    "relative px-4 py-3 text-sm font-medium transition",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-[1400px] px-6 py-8 md:px-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Today's focus</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-prioritized tasks based on deadlines, effort, and risk.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Task</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Deadline</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">AI Priority</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Risk</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Suggested Slot</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const highRisk = t.risk > 50;
                  return (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-secondary/40 cursor-pointer",
                        highRisk && "bg-[var(--risk-high)]/40 hover:bg-[var(--risk-high)]/70",
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{t.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {t.category} · {t.estimate} estimated
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{t.date}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{t.timeLeft}</div>
                      </td>
                      <td className="px-5 py-4">
                        <PriorityPill priority={t.priority} score={t.score} />
                      </td>
                      <td className="px-5 py-4">
                        <RiskBar value={t.risk} />
                      </td>
                      <td className="px-5 py-4 text-foreground/80 whitespace-nowrap">{t.slot}</td>
                      <td className="px-5 py-4">
                        <StatusPill status={t.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Active tasks", value: "4", hint: "in your queue" },
            { label: "High priority", value: "2", hint: "need attention" },
            { label: "Elevated risk", value: "1", hint: ">50% risk score" },
            { label: "Workload", value: "12h", hint: "committed today" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Index() {
  return <Dashboard />;
}
