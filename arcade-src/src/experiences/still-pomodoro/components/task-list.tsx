import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/experiences/still-pomodoro/components/ui/button";
import { Checkbox } from "@/experiences/still-pomodoro/components/ui/checkbox";
import { Input } from "@/experiences/still-pomodoro/components/ui/input";
import { usePomodoroStore } from "@/experiences/still-pomodoro/lib/pomodoro-store";
import { cn } from "@/shared/cn";

export function TaskList() {
  const tasks = usePomodoroStore((s) => s.tasks);
  const activeTaskId = usePomodoroStore((s) => s.activeTaskId);
  const addTask = usePomodoroStore((s) => s.addTask);
  const toggleTask = usePomodoroStore((s) => s.toggleTask);
  const removeTask = usePomodoroStore((s) => s.removeTask);
  const setActiveTask = usePomodoroStore((s) => s.setActiveTask);
  const [draft, setDraft] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    addTask(draft);
    setDraft("");
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <section className="flex h-full flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-medium tracking-tight text-fg">This session</h2>
        <p className="text-sm text-muted tabular-nums">
          {tasks.length === 0 ? "No tasks" : `${remaining} open`}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mb-4 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task"
          aria-label="New task"
          data-testid="task-input"
          maxLength={80}
        />
        <Button
          type="submit"
          variant="secondary"
          size="icon"
          aria-label="Add task"
          data-testid="add-task"
          disabled={!draft.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </form>

      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Queue the one thing this block is for.
        </p>
      ) : (
        <ul className="flex flex-col gap-1" data-testid="task-list">
          {tasks.map((task) => {
            const active = task.id === activeTaskId && !task.done;
            return (
              <li
                key={task.id}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 ease-out",
                  active && "bg-surface-2",
                )}
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => toggleTask(task.id)}
                  aria-label={task.done ? `Mark ${task.title} as open` : `Complete ${task.title}`}
                />
                <button
                  type="button"
                  onClick={() => setActiveTask(task.id)}
                  disabled={task.done}
                  className={cn(
                    "min-w-0 flex-1 py-2 text-left text-sm transition-colors duration-150",
                    task.done && "text-subtle line-through",
                    active && "font-medium text-fg",
                    !task.done && !active && "text-fg",
                  )}
                >
                  {task.title}
                  {active && (
                    <span className="ml-2 text-xs font-medium text-muted">
                      Now
                    </span>
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 text-subtle opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  aria-label={`Remove ${task.title}`}
                  onClick={() => removeTask(task.id)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
