import { Minus, Plus, Settings } from "lucide-react";
import { Button } from "@/experiences/still-pomodoro/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/experiences/still-pomodoro/components/ui/dialog";
import { Label } from "@/experiences/still-pomodoro/components/ui/label";
import { Switch } from "@/experiences/still-pomodoro/components/ui/switch";
import { usePomodoroStore } from "@/experiences/still-pomodoro/lib/pomodoro-store";

type StepperProps = {
  id: string;
  label: string;
  hint: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
};

function Stepper({ id, label, hint, value, unit = "min", min, max, step, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-11 rounded-md"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - step)}
        >
          <Minus className="size-4" />
        </Button>
        <div
          id={id}
          className="w-16 text-center text-sm tabular-nums text-fg"
          aria-live="polite"
        >
          {value}
          <span className="sr-only"> {unit}</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-11 rounded-md"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + step)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function SettingsDialog() {
  const workMinutes = usePomodoroStore((s) => s.workMinutes);
  const shortBreakMinutes = usePomodoroStore((s) => s.shortBreakMinutes);
  const longBreakMinutes = usePomodoroStore((s) => s.longBreakMinutes);
  const sessionsUntilLong = usePomodoroStore((s) => s.sessionsUntilLong);
  const soundEnabled = usePomodoroStore((s) => s.soundEnabled);
  const setWorkMinutes = usePomodoroStore((s) => s.setWorkMinutes);
  const setShortBreakMinutes = usePomodoroStore((s) => s.setShortBreakMinutes);
  const setLongBreakMinutes = usePomodoroStore((s) => s.setLongBreakMinutes);
  const setSessionsUntilLong = usePomodoroStore((s) => s.setSessionsUntilLong);
  const setSoundEnabled = usePomodoroStore((s) => s.setSoundEnabled);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Timer settings">
          <Settings className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lengths</DialogTitle>
          <DialogDescription>Adjust focus and break times. Changes reset the current interval.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <Stepper
            id="work-length"
            label="Focus"
            hint="Deep work interval"
            value={workMinutes}
            min={5}
            max={90}
            step={5}
            onChange={setWorkMinutes}
          />
          <Stepper
            id="short-break"
            label="Break"
            hint="Between focus blocks"
            value={shortBreakMinutes}
            min={1}
            max={30}
            step={1}
            onChange={setShortBreakMinutes}
          />
          <Stepper
            id="long-break"
            label="Long break"
            hint="After a full cycle"
            value={longBreakMinutes}
            min={5}
            max={45}
            step={5}
            onChange={setLongBreakMinutes}
          />
          <Stepper
            id="cycle-length"
            label="Cycle"
            hint="Focus sessions until long break"
            value={sessionsUntilLong}
            unit="sessions"
            min={2}
            max={8}
            step={1}
            onChange={setSessionsUntilLong}
          />
          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <div>
              <Label htmlFor="sound-toggle">Sound</Label>
              <p className="text-sm text-muted">Chime when an interval ends</p>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              aria-label="Play sound when an interval completes"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
