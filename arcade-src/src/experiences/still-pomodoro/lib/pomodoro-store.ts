import { create } from "zustand";
import { todayKey } from "@/shared/cn";
import { playCompleteChime, unlockAudio } from "@/experiences/still-pomodoro/lib/sound";

export type Mode = "work" | "shortBreak" | "longBreak";

export type Task = {
  id: string;
  title: string;
  done: boolean;
};

export type StatusKind = "idle" | "workDone" | "breakDone";

const STORAGE_KEY = "still-pomodoro-v1";

export const MODE_LABEL: Record<Mode, string> = {
  work: "Focus",
  shortBreak: "Break",
  longBreak: "Long",
};

export const MODE_FULL: Record<Mode, string> = {
  work: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};


type Persisted = {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLong: number;
  soundEnabled: boolean;
  tasks: Task[];
  activeTaskId: string | null;
  workSessionsCompleted: number;
  completedToday: number;
  todayKey: string;
};

const defaults: Persisted = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsUntilLong: 4,
  soundEnabled: true,
  tasks: [],
  activeTaskId: null,
  workSessionsCompleted: 0,
  completedToday: 0,
  todayKey: todayKey(),
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function durationMsFor(
  mode: Mode,
  workMinutes: number,
  shortBreakMinutes: number,
  longBreakMinutes: number,
) {
  const minutes =
    mode === "work" ? workMinutes : mode === "shortBreak" ? shortBreakMinutes : longBreakMinutes;
  return minutes * 60 * 1000;
}

type PomodoroState = Persisted & {
  mode: Mode;
  isRunning: boolean;
  remainingMs: number;
  endsAt: number | null;
  statusKind: StatusKind;
  hydrated: boolean;

  durationMs: () => number;
  hydrate: () => void;
  persist: () => void;
  rollToday: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  complete: () => void;
  setMode: (mode: Mode) => void;
  setWorkMinutes: (n: number) => void;
  setShortBreakMinutes: (n: number) => void;
  setLongBreakMinutes: (n: number) => void;
  setSessionsUntilLong: (n: number) => void;
  setSoundEnabled: (on: boolean) => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setActiveTask: (id: string) => void;
  clearStatus: () => void;
};

function pickPersisted(state: PomodoroState): Persisted {
  return {
    workMinutes: state.workMinutes,
    shortBreakMinutes: state.shortBreakMinutes,
    longBreakMinutes: state.longBreakMinutes,
    sessionsUntilLong: state.sessionsUntilLong,
    soundEnabled: state.soundEnabled,
    tasks: state.tasks,
    activeTaskId: state.activeTaskId,
    workSessionsCompleted: state.workSessionsCompleted,
    completedToday: state.completedToday,
    todayKey: state.todayKey,
  };
}

function applyDuration(state: PomodoroState, next: Partial<Persisted> = {}): Partial<PomodoroState> {
  const workMinutes = next.workMinutes ?? state.workMinutes;
  const shortBreakMinutes = next.shortBreakMinutes ?? state.shortBreakMinutes;
  const longBreakMinutes = next.longBreakMinutes ?? state.longBreakMinutes;
  const remainingMs = durationMsFor(state.mode, workMinutes, shortBreakMinutes, longBreakMinutes);
  return {
    ...next,
    remainingMs,
    endsAt: null,
    isRunning: false,
  };
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  ...defaults,
  mode: "work",
  isRunning: false,
  remainingMs: defaults.workMinutes * 60 * 1000,
  endsAt: null,
  statusKind: "idle",
  hydrated: false,

  durationMs: () => {
    const s = get();
    return durationMsFor(s.mode, s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes);
  },

  persist: () => {
    if (typeof window === "undefined") return;
    const s = get();
    if (!s.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersisted(s)));
    } catch {
      /* ignore quota */
    }
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    if (get().hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<Persisted>;
        set({
          workMinutes: clamp(Number(data.workMinutes) || defaults.workMinutes, 5, 90),
          shortBreakMinutes: clamp(Number(data.shortBreakMinutes) || defaults.shortBreakMinutes, 1, 30),
          longBreakMinutes: clamp(Number(data.longBreakMinutes) || defaults.longBreakMinutes, 5, 45),
          sessionsUntilLong: clamp(Number(data.sessionsUntilLong) || defaults.sessionsUntilLong, 2, 8),
          soundEnabled: data.soundEnabled !== false,
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          activeTaskId: data.activeTaskId ?? null,
          workSessionsCompleted: clamp(Number(data.workSessionsCompleted) || 0, 0, 8),
          completedToday: Math.max(0, Number(data.completedToday) || 0),
          todayKey: typeof data.todayKey === "string" ? data.todayKey : todayKey(),
        });
      }
    } catch {
      /* keep defaults */
    }
    const s = get();
    set({
      remainingMs: durationMsFor(s.mode, s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes),
      hydrated: true,
    });
    get().rollToday();
  },

  rollToday: () => {
    const key = todayKey();
    if (get().todayKey === key) return;
    set({ todayKey: key, completedToday: 0 });
    get().persist();
  },

  start: () => {
    unlockAudio();
    const s = get();
    if (s.isRunning) return;
    const remaining = Math.max(0, s.remainingMs);
    if (remaining <= 0) {
      get().complete();
      return;
    }
    set({
      isRunning: true,
      endsAt: Date.now() + remaining,
      statusKind: "idle",
    });
  },

  pause: () => {
    const s = get();
    if (!s.isRunning) return;
    const left = s.endsAt ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;
    set({ isRunning: false, endsAt: null, remainingMs: left });
  },

  reset: () => {
    const s = get();
    set({
      isRunning: false,
      endsAt: null,
      remainingMs: durationMsFor(s.mode, s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes),
      statusKind: "idle",
    });
  },

  complete: () => {
    const s = get();
    if (s.soundEnabled) playCompleteChime();

    if (s.mode === "work") {
      const nextCount = s.workSessionsCompleted + 1;
      const longNow = nextCount >= s.sessionsUntilLong;
      const nextMode: Mode = longNow ? "longBreak" : "shortBreak";
      set({
        mode: nextMode,
        isRunning: false,
        endsAt: null,
        remainingMs: durationMsFor(nextMode, s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes),
        workSessionsCompleted: longNow ? 0 : nextCount,
        completedToday: s.completedToday + 1,
        statusKind: "workDone",
      });
    } else {
      set({
        mode: "work",
        isRunning: false,
        endsAt: null,
        remainingMs: durationMsFor("work", s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes),
        statusKind: "breakDone",
      });
    }
    get().persist();
  },

  setMode: (mode) => {
    const s = get();
    if (s.mode === mode && !s.isRunning) return;
    set({
      mode,
      isRunning: false,
      endsAt: null,
      remainingMs: durationMsFor(mode, s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes),
      statusKind: "idle",
    });
  },

  setWorkMinutes: (n) => {
    const value = clamp(Math.round(n), 5, 90);
    set((s) => applyDuration(s, { workMinutes: value }));
    get().persist();
  },

  setShortBreakMinutes: (n) => {
    const value = clamp(Math.round(n), 1, 30);
    set((s) => applyDuration(s, { shortBreakMinutes: value }));
    get().persist();
  },

  setLongBreakMinutes: (n) => {
    const value = clamp(Math.round(n), 5, 45);
    set((s) => applyDuration(s, { longBreakMinutes: value }));
    get().persist();
  },

  setSessionsUntilLong: (n) => {
    const value = clamp(Math.round(n), 2, 8);
    set({ sessionsUntilLong: value, workSessionsCompleted: 0 });
    get().persist();
  },

  setSoundEnabled: (on) => {
    if (on) unlockAudio();
    set({ soundEnabled: on });
    get().persist();
  },

  addTask: (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      done: false,
    };
    set((s) => ({
      tasks: [...s.tasks, task],
      activeTaskId: s.activeTaskId ?? task.id,
    }));
    get().persist();
  },

  toggleTask: (id) => {
    set((s) => {
      const tasks = s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      let activeTaskId = s.activeTaskId;
      const toggled = tasks.find((t) => t.id === id);
      if (toggled?.done && activeTaskId === id) {
        activeTaskId = tasks.find((t) => !t.done)?.id ?? null;
      }
      if (toggled && !toggled.done) {
        activeTaskId = id;
      }
      return { tasks, activeTaskId };
    });
    get().persist();
  },

  removeTask: (id) => {
    set((s) => {
      const tasks = s.tasks.filter((t) => t.id !== id);
      const activeTaskId =
        s.activeTaskId === id ? (tasks.find((t) => !t.done)?.id ?? null) : s.activeTaskId;
      return { tasks, activeTaskId };
    });
    get().persist();
  },

  setActiveTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task || task.done) return;
    set({ activeTaskId: id });
    get().persist();
  },

  clearStatus: () => set({ statusKind: "idle" }),
}));

export function remainingNow(state: Pick<PomodoroState, "isRunning" | "endsAt" | "remainingMs">) {
  if (state.isRunning && state.endsAt) {
    return Math.max(0, state.endsAt - Date.now());
  }
  return Math.max(0, state.remainingMs);
}
