import { useState, type MutableRefObject } from "react";
import { Download, SlidersHorizontal, UserRound } from "lucide-react";
import { toast } from "sonner";
import { FieldControls } from "@/experiences/helix/components/field-controls";
import { Button } from "@/experiences/helix/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/experiences/helix/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/experiences/helix/components/ui/tooltip";
import { SignedIn, SignedOut, UserButton } from "@/shared/auth";
import { useCurrentUserState } from "@/shared/auth";
import type { ParticleField } from "@/experiences/helix/lib/field/engine";
import { useFieldStore } from "@/experiences/helix/lib/field/store";
import { cn } from "@/shared/cn";

type Props = {
  engineRef: MutableRefObject<ParticleField | null>;
};

export function FieldChrome({ engineRef }: Props) {
  const [open, setOpen] = useState(false);
  const resetDefaults = useFieldStore((s) => s.resetDefaults);

  const clear = () => {
    engineRef.current?.clearTrails();
    toast("Trails cleared");
  };

  const reset = () => {
    resetDefaults();
    engineRef.current?.resetParticles();
    toast("Field reset");
  };

  const download = () => {
    const field = engineRef.current;
    if (!field) return;
    const href = field.capture();
    const a = document.createElement("a");
    a.href = href;
    a.download = `helix-${Date.now()}.png`;
    a.click();
    toast("Screenshot saved");
  };

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="pointer-events-none max-w-[16rem]">
          <p className="font-display text-[1.75rem] leading-none tracking-tight text-fg italic md:text-[2rem]">
            Helix
          </p>
          <p className="mt-1.5 hidden text-xs leading-relaxed text-muted sm:block">
            Move to stir. Hold to pull. Click to pulse.
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <AuthSlot />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Download screenshot"
                onClick={download}
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download screenshot</TooltipContent>
          </Tooltip>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Open controls"
                >
                  <SlidersHorizontal className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Controls</SheetTitle>
                  <SheetDescription>
                    Tune the field, then drag across the canvas.
                  </SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto pb-2">
                  <FieldControls onClear={clear} onReset={reset} />
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={download}
                  >
                    <Download className="size-4" />
                    Download screenshot
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <aside
        className={cn(
          "pointer-events-auto absolute bottom-6 left-6 z-10 hidden w-[20.5rem] md:block",
          "rounded-2xl bg-surface/92 p-4 text-fg shadow-panel",
        )}
      >
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-subtle uppercase">
              Field
            </p>
            <p className="mt-0.5 font-display text-lg leading-tight text-fg">
              Atmosphere
            </p>
          </div>
        </div>
        <FieldControls onClear={clear} onReset={reset} />
      </aside>
    </>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div className="size-11 animate-pulse rounded-md bg-fg/8" aria-hidden />
    );
  }

  return (
    <>
      <SignedOut>
        <Button variant="secondary" size="icon" className="sm:hidden" asChild>
          <a href="/login" aria-label="Sign in">
            <UserRound className="size-4" />
          </a>
        </Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
          <a href="/login">Sign in</a>
        </Button>
      </SignedOut>
      <SignedIn>
        <div className="hidden max-w-[12rem] truncate sm:block">
          {user ? <UserButton /> : null}
        </div>
      </SignedIn>
    </>
  );
}
