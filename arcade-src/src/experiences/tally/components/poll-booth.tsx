import { useEffect } from "react";
import { Check, PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/experiences/tally/components/ui/button";
import {
  optionShare,
  totalVotes,
  usePollStore,
} from "@/experiences/tally/lib/poll-store";
import { cn } from "@/shared/cn";

function VoteCounter({ count }: { count: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        key={count}
        className="count-pop font-medium tabular-nums text-fg"
      >
        {count}
      </span>
      <span>{count === 1 ? "vote" : "votes"}</span>
    </span>
  );
}

export function PollBooth() {
  const poll = usePollStore((state) => state.poll);
  const votedOptionId = usePollStore((state) => state.votedOptionId);
  const liveEnabled = usePollStore((state) => state.liveEnabled);
  const vote = usePollStore((state) => state.vote);
  const resetVotes = usePollStore((state) => state.resetVotes);
  const startNew = usePollStore((state) => state.startNew);
  const addSimulatedVote = usePollStore((state) => state.addSimulatedVote);
  const setLiveEnabled = usePollStore((state) => state.setLiveEnabled);

  const hasVoted = Boolean(votedOptionId);
  const votes = totalVotes(poll);
  const leadingId =
    hasVoted && poll
      ? poll.options.reduce((best, option) =>
          option.votes > best.votes ? option : best,
        ).id
      : null;

  useEffect(() => {
    if (!hasVoted || !liveEnabled) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        addSimulatedVote();
        schedule();
      }, 900 + Math.random() * 1500);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [addSimulatedVote, hasVoted, liveEnabled]);

  if (!poll) return null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <VoteCounter count={votes} />
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          {hasVoted ? (
            <button
              type="button"
              onClick={() => setLiveEnabled(!liveEnabled)}
              className="inline-flex h-11 items-center gap-2 text-sm text-muted transition-colors duration-[var(--motion-quick)] hover:text-fg"
              aria-pressed={liveEnabled}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full bg-fg",
                  liveEnabled && "live-dot",
                )}
                aria-hidden="true"
              />
              {liveEnabled ? "Live room" : "Live paused"}
            </button>
          ) : (
            <span>Vote once to open the results</span>
          )}
        </div>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-balance sm:text-4xl">
          {poll.question}
        </h1>
        {hasVoted ? (
          <p className="text-sm text-muted" aria-live="polite">
            Your vote is locked. Bars shift as the room keeps voting.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Choose one. After you vote, the room stays live.
          </p>
        )}
      </div>

      <div
        role={hasVoted ? "list" : "radiogroup"}
        aria-label={hasVoted ? "Poll results" : "Poll options"}
        className="flex flex-col gap-2"
      >
        {poll.options.map((option, index) => {
          const selected = votedOptionId === option.id;
          const leading = leadingId === option.id && votes > 0;
          const percent = hasVoted ? optionShare(option.votes, votes) : 0;
          const disabled = hasVoted && !selected;

          return (
            <button
              key={option.id}
              type="button"
              role={hasVoted ? undefined : "radio"}
              aria-checked={hasVoted ? undefined : selected}
              disabled={hasVoted}
              onClick={() => vote(option.id)}
              style={{ animationDelay: `${index * 40}ms` }}
              className={cn(
                "reveal-item relative isolate flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-left transition-[box-shadow,background-color,opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                !hasVoted &&
                  "bg-elevated shadow-border hover:shadow-border-hover active:scale-[0.99]",
                hasVoted && "cursor-not-allowed bg-elevated/70 shadow-border",
                selected && "shadow-border-hover ring-1 ring-primary/70",
                disabled && "opacity-70",
              )}
            >
              <span
                className={cn(
                  "poll-bar absolute inset-y-0 left-0 -z-10",
                  selected ? "bg-bar/45" : "bg-bar/25",
                )}
                style={{ width: hasVoted ? `${percent}%` : "0%" }}
                aria-hidden="true"
              />
              {selected && (
                <span
                  className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                  aria-hidden="true"
                />
              )}

              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                  selected
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border text-subtle",
                )}
                aria-hidden="true"
              >
                {selected ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">
                  {option.label}
                </span>
                {selected && (
                  <span className="block text-xs text-muted">Your vote</span>
                )}
              </span>

              <span
                className={cn(
                  "flex shrink-0 items-center gap-2 tabular-nums",
                  hasVoted ? "opacity-100" : "opacity-0",
                )}
                aria-hidden={!hasVoted}
              >
                {leading && hasVoted && (
                  <span className="rounded-sm bg-bg px-1.5 py-0.5 text-xs font-medium text-muted">
                    Lead
                  </span>
                )}
                <span className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-medium text-fg">{percent}%</span>
                  <span className="text-xs text-subtle">
                    {option.votes} {option.votes === 1 ? "vote" : "votes"}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle" aria-live="polite">
          {hasVoted
            ? liveEnabled
              ? "Audience votes arrive automatically so the bars stay in motion."
              : "Live room is paused. Your vote remains counted."
            : "Results stay hidden until you cast a vote."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={resetVotes}
            disabled={!hasVoted && votes === 0}
          >
            <RotateCcw />
            Reset votes
          </Button>
          <Button type="button" variant="secondary" onClick={startNew}>
            <PenLine />
            New poll
          </Button>
        </div>
      </div>
    </div>
  );
}
