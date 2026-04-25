import { createFileRoute } from "@tanstack/react-router";
import { Bell, Plus, Search, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  component: Index,
});

type Priority = "HIGH" | "MED" | "LOW";
type Status = "In Progress" | "Pending";

interface Task {
  id: string;
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
  description?: string;
}

const initialTasks: Task[] = [
  {
    id: "1",
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
    id: "2",
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
    id: "3",
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
    id: "4",
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
type Tab = (typeof tabs)[number];

// ── AI prioritisation engine ─────────────────────────────────────────────────
function computeAIPriority(
  deadlineDate: Date,
  estimateHours: number,
  manualPriority: Priority,
): { priority: Priority; score: number; risk: number; slot: string; timeLeft: string; date: string } {
  const now = new Date();
  const daysLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  const urgency = Math.max(0, 100 - daysLeft * 10);
  const effortPenalty = Math.min(estimateHours * 4, 30);
  const manualBoost = manualPriority === "HIGH" ? 20 : manualPriority === "MED" ? 8 : 0;
  const score = Math.min(99, Math.round(urgency + effortPenalty + manualBoost));

  const risk = Math.min(95, Math.round((estimateHours / Math.max(daysLeft, 0.5)) * 20 + (score > 70 ? 20 : 0)));

  const priority: Priority = score >= 75 ? "HIGH" : score >= 45 ? "MED" : "LOW";

  const slotHour = priority === "HIGH" ? "09:00" : priority === "MED" ? "14:00" : "17:00";
  const slot =
    daysLeft < 1
      ? `Today ${slotHour}`
      : daysLeft < 2
        ? `Tomorrow ${slotHour}`
        : `${deadlineDate.toLocaleDateString("en-US", { weekday: "short" })} ${slotHour}`;

  const timeLeft =
    daysLeft < 0
      ? "Overdue"
      : daysLeft < 1
        ? `${Math.round(daysLeft * 24)}h left`
        : `${Math.floor(daysLeft)}d left`;

  const date = deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return { priority, score, risk, slot, timeLeft, date };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PriorityPill({ priority, score }: { priority: Priority; score: number }) {
  const styles: Record<Priority, string> = {
    HIGH: "bg-[var(--priority-high-bg)] text-[var(--priority-high-fg)]",
    MED: "bg-[var(--priority-med-bg)] text-[var(--priority-med-fg)]",
    LOW: "bg-[var(--priority-low-bg)] text-[var(--priority-low-fg)]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide", styles[priority])}>
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
    <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium", styles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "In Progress" ? "bg-current animate-pulse" : "bg-current opacity-50")} />
      {status}
    </span>
  );
}

function RiskBar({ value }: { value: number }) {
  const color = value >= 60 ? "bg-[var(--priority-high-fg)]" : value >= 30 ? "bg-[var(--priority-med-fg)]" : "bg-[var(--priority-low-fg)]";
  return (
    <div className="flex items-center gap-2.5 min-w-[88px]">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-foreground/70 w-9 text-right">{value}%</span>
    </div>
  );
}

// ── New Task Dialog ───────────────────────────────────────────────────────────
interface NewTaskFormData {
  title: string;
  category: string;
  estimateHours: string;
  deadline: string;
  status: Status;
  manualPriority: Priority;
  description: string;
}

const emptyForm: NewTaskFormData = {
  title: "",
  category: "Study",
  estimateHours: "1",
  deadline: "",
  status: "Pending",
  manualPriority: "MED",
  description: "",
};

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (task: Task) => void;
}

function NewTaskDialog({ open, onOpenChange, onAdd }: NewTaskDialogProps) {
  const [form, setForm] = useState<NewTaskFormData>(emptyForm);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewTaskFormData, string>>>({});

  function validate() {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "Task title is required.";
    if (!form.deadline) e.deadline = "Deadline is required.";
    else if (new Date(form.deadline) < new Date()) e.deadline = "Deadline must be in the future.";
    if (!form.estimateHours || Number(form.estimateHours) <= 0) e.estimateHours = "Enter a valid estimate.";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setIsAnalyzing(true);

    // Brief artificial delay to sell the "AI analysing" moment
    setTimeout(() => {
      const ai = computeAIPriority(new Date(form.deadline), Number(form.estimateHours), form.manualPriority);
      const task: Task = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        category: form.category,
        estimate: `${form.estimateHours}h`,
        description: form.description,
        status: form.status,
        ...ai,
      };
      onAdd(task);
      setIsAnalyzing(false);
      setForm(emptyForm);
      onOpenChange(false);
    }, 900);
  }

  function field(key: keyof NewTaskFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
            </div>
            Add New Task
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Brain className="h-3.5 w-3.5 text-primary" />
            AI will auto-calculate priority score, risk, and suggested time slot.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="title">Task Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="e.g. Submit assignment, Fix login bug…"
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => field("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Study", "Work", "Personal", "Health", "Finance"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Manual Priority Hint</Label>
              <Select value={form.manualPriority} onValueChange={(v) => field("manualPriority", v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">🔴 High</SelectItem>
                  <SelectItem value="MED">🟡 Medium</SelectItem>
                  <SelectItem value="LOW">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimate + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="estimate">Time Estimate (hours) <span className="text-destructive">*</span></Label>
              <Input
                id="estimate"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="e.g. 3"
                value={form.estimateHours}
                onChange={(e) => field("estimateHours", e.target.value)}
                className={cn(errors.estimateHours && "border-destructive")}
              />
              {errors.estimateHours && <p className="text-xs text-destructive">{errors.estimateHours}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deadline">Deadline <span className="text-destructive">*</span></Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => field("deadline", e.target.value)}
                className={cn(errors.deadline && "border-destructive")}
              />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Initial Status</Label>
            <Select value={form.status} onValueChange={(v) => field("status", v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">
              Notes / Description{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Any extra context for the AI engine…"
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => { setForm(emptyForm); setErrors({}); onOpenChange(false); }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60 transition shadow-sm"
          >
            {isAnalyzing ? (
              <><Sparkles className="h-4 w-4 animate-spin" /> AI Analysing…</>
            ) : (
              <><Brain className="h-4 w-4" /> Add &amp; Prioritise</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<Tab>("All tasks");
  const [dialogOpen, setDialogOpen] = useState(false);

  function addTask(task: Task) {
    setTasks((prev) => [task, ...prev].sort((a, b) => b.score - a.score));
  }

  const visibleTasks = tasks.filter((t) => {
    if (activeTab === "High priority") return t.priority === "HIGH";
    if (activeTab === "At risk") return t.risk > 50;
    if (activeTab === "Today") return t.slot.startsWith("Today");
    return true;
  });

  const totalHours = tasks.reduce((sum, t) => sum + parseFloat(t.estimate), 0);
  const highCount = tasks.filter((t) => t.priority === "HIGH").length;
  const atRiskCount = tasks.filter((t) => t.risk > 50).length;

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
              {atRiskCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--priority-high-fg)] px-1 text-[10px] font-bold text-white">
                  {atRiskCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2.5 rounded-lg pl-2 pr-3 py-1 hover:bg-secondary transition cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.65_0.18_290)] text-xs font-semibold text-primary-foreground">
                TS
              </div>
              <span className="text-sm font-medium">Tanishka Sharma</span>
            </div>

            <button
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background hover:opacity-90 transition shadow-sm"
            >
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
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-4 py-3 text-sm font-medium transition",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground" />}
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
          <button
            onClick={() => setDialogOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            {visibleTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <Brain className="h-10 w-10 opacity-30" />
                <p className="text-sm">No tasks in this view. Add one with the <strong>New Task</strong> button.</p>
              </div>
            ) : (
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
                  {visibleTasks.map((t) => (
                    <tr
                      key={t.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-secondary/40 cursor-pointer",
                        t.risk > 50 && "bg-[var(--risk-high)]/40 hover:bg-[var(--risk-high)]/70",
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{t.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {t.category} · {t.estimate} estimated
                          {t.description && (
                            <span className="ml-1 opacity-60">
                              · {t.description.slice(0, 40)}{t.description.length > 40 ? "…" : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{t.date}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{t.timeLeft}</div>
                      </td>
                      <td className="px-5 py-4"><PriorityPill priority={t.priority} score={t.score} /></td>
                      <td className="px-5 py-4"><RiskBar value={t.risk} /></td>
                      <td className="px-5 py-4 text-foreground/80 whitespace-nowrap">{t.slot}</td>
                      <td className="px-5 py-4"><StatusPill status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Reactive summary stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Active tasks",   value: String(tasks.length), hint: "in your queue" },
            { label: "High priority",  value: String(highCount),    hint: "need attention" },
            { label: "Elevated risk",  value: String(atRiskCount),  hint: ">50% risk score" },
            { label: "Workload",       value: `${totalHours}h`,     hint: "committed today" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <NewTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addTask} />
    </div>
  );
}

function Index() {
  return <Dashboard />;
}
