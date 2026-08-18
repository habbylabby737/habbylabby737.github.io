import { create } from "zustand";

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
};

type PollState = {
  poll: Poll | null;
  votedOptionId: string | null;
  liveEnabled: boolean;
  createPoll: (question: string, optionLabels: string[]) => void;
  vote: (optionId: string) => boolean;
  resetVotes: () => void;
  startNew: () => void;
  addSimulatedVote: () => void;
  setLiveEnabled: (enabled: boolean) => void;
};

const STARTER_POLL: Poll = {
  id: "starter",
  question: "Which afternoon ritual actually restores you?",
  options: [
    { id: "opt-espresso", label: "A perfect espresso", votes: 0 },
    { id: "opt-walk", label: "A long walk outside", votes: 0 },
    { id: "opt-focus", label: "An uninterrupted work block", votes: 0 },
    { id: "opt-nap", label: "A twenty-minute nap", votes: 0 },
  ],
};

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function pickWeightedOptionId(options: PollOption[]): string | null {
  if (options.length === 0) return null;
  const weights = options.map((option) => option.votes + 1.25);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let ticket = Math.random() * total;
  for (let i = 0; i < options.length; i += 1) {
    ticket -= weights[i] ?? 0;
    if (ticket <= 0) return options[i]?.id ?? options[0].id;
  }
  return options[options.length - 1]?.id ?? null;
}

export function totalVotes(poll: Poll | null): number {
  if (!poll) return 0;
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

export function optionShare(votes: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 100);
}

export const usePollStore = create<PollState>((set, get) => ({
  poll: STARTER_POLL,
  votedOptionId: null,
  liveEnabled: true,
  createPoll: (question, optionLabels) => {
    const options = optionLabels
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => ({
        id: newId("opt"),
        label,
        votes: 0,
      }));
    if (options.length < 2) return;
    set({
      poll: {
        id: newId("poll"),
        question: question.trim(),
        options,
      },
      votedOptionId: null,
      liveEnabled: true,
    });
  },
  vote: (optionId) => {
    const { poll, votedOptionId } = get();
    if (!poll || votedOptionId) return false;
    const exists = poll.options.some((option) => option.id === optionId);
    if (!exists) return false;
    set({
      votedOptionId: optionId,
      poll: {
        ...poll,
        options: poll.options.map((option) =>
          option.id === optionId
            ? { ...option, votes: option.votes + 1 }
            : option,
        ),
      },
    });
    return true;
  },
  resetVotes: () => {
    const { poll } = get();
    if (!poll) return;
    set({
      votedOptionId: null,
      poll: {
        ...poll,
        options: poll.options.map((option) => ({ ...option, votes: 0 })),
      },
    });
  },
  startNew: () => {
    set({ poll: null, votedOptionId: null, liveEnabled: true });
  },
  addSimulatedVote: () => {
    const { poll, votedOptionId } = get();
    if (!poll || !votedOptionId) return;
    const optionId = pickWeightedOptionId(poll.options);
    if (!optionId) return;
    set({
      poll: {
        ...poll,
        options: poll.options.map((option) =>
          option.id === optionId
            ? { ...option, votes: option.votes + 1 }
            : option,
        ),
      },
    });
  },
  setLiveEnabled: (enabled) => set({ liveEnabled: enabled }),
}));
