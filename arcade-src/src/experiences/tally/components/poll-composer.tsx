import { useMemo, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/experiences/tally/components/ui/button";
import { Input } from "@/experiences/tally/components/ui/input";
import { Label } from "@/experiences/tally/components/ui/label";
import { usePollStore } from "@/experiences/tally/lib/poll-store";
import { cn } from "@/shared/cn";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const MAX_QUESTION = 140;
const MAX_OPTION = 60;

export function PollComposer() {
  const createPoll = usePollStore((state) => state.createPoll);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [attempted, setAttempted] = useState(false);

  const cleanedOptions = useMemo(
    () => options.map((option) => option.trim()).filter(Boolean),
    [options],
  );

  const uniqueCount = new Set(
    cleanedOptions.map((option) => option.toLowerCase()),
  ).size;

  const questionError =
    attempted && question.trim().length < 8
      ? "Ask a question of at least 8 characters."
      : null;
  const optionsError = attempted
    ? cleanedOptions.length < MIN_OPTIONS
      ? "Add at least two options."
      : uniqueCount < cleanedOptions.length
        ? "Each option needs to be unique."
        : null
    : null;

  function updateOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, i) => (i === index ? value : option)),
    );
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((current) => [...current, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (question.trim().length < 8) return;
    if (cleanedOptions.length < MIN_OPTIONS) return;
    if (uniqueCount < cleanedOptions.length) return;
    createPoll(question, cleanedOptions);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">
          New poll
        </p>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-balance sm:text-4xl">
          Ask the room something worth deciding.
        </h1>
        <p className="max-w-md text-sm leading-normal text-pretty text-muted">
          Write a clear question, add a few distinct options, then open the
          floor. Everyone here votes once.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="poll-question">Question</Label>
        <Input
          id="poll-question"
          value={question}
          maxLength={MAX_QUESTION}
          placeholder="Where should we hold the offsite?"
          onChange={(event) => setQuestion(event.target.value)}
          aria-invalid={Boolean(questionError)}
        />
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-xs",
              questionError ? "text-fg" : "text-subtle",
            )}
          >
            {questionError ?? "Keep it specific — one decision, one question."}
          </p>
          <span className="shrink-0 tabular-nums text-xs text-subtle">
            {question.length}/{MAX_QUESTION}
          </span>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-fg">Options</legend>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center font-medium tabular-nums text-subtle">
                {index + 1}
              </span>
              <Input
                value={option}
                maxLength={MAX_OPTION}
                placeholder={
                  index === 0
                    ? "First choice"
                    : index === 1
                      ? "Second choice"
                      : "Another choice"
                }
                onChange={(event) => updateOption(index, event.target.value)}
                aria-label={`Option ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={options.length <= MIN_OPTIONS}
                onClick={() => removeOption(index)}
                aria-label={`Remove option ${index + 1}`}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        {optionsError ? (
          <p className="text-xs text-fg">{optionsError}</p>
        ) : (
          <p className="text-xs text-subtle">
            {options.length} of {MAX_OPTIONS} options
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={options.length >= MAX_OPTIONS}
          onClick={addOption}
        >
          <Plus />
          Add option
        </Button>
      </fieldset>

      <Button type="submit" size="lg" className="w-full sm:w-auto sm:self-end">
        Open the poll
      </Button>
    </form>
  );
}
