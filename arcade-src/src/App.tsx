import { lazy, Suspense, type ComponentType } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ArcadeChrome } from "./chrome";
import { Picker } from "./picker";
import { TooltipProvider } from "./experiences/helix/components/ui/tooltip";

const loaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  wakepoint: () => import("./experiences/wakepoint"),
  sunstone: () => import("./experiences/sunstone"),
  "solar-orrery": () => import("./experiences/solar-orrery"),
  apsides: () => import("./experiences/apsides"),
  kinetic: () => import("./experiences/kinetic"),
  still: () => import("./experiences/still"),
  drift: () => import("./experiences/drift"),
  helix: () => import("./experiences/helix"),
  sylva: () => import("./experiences/sylva"),
  dotfield: () => import("./experiences/dotfield"),
  cast: () => import("./experiences/cast"),
  "signal-synth": () => import("./experiences/signal-synth"),
  tally: () => import("./experiences/tally"),
  "still-timer": () => import("./experiences/still-pomodoro"),
};

function ExperiencePage({ id }: { id: string }) {
  const Load = lazy(loaders[id]);
  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <Suspense
        fallback={
          <div className="grid h-dvh place-items-center text-sm tracking-[0.2em] text-muted uppercase">
            Opening
          </div>
        }
      >
        <Load />
      </Suspense>
      <ArcadeChrome id={id} />
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <TooltipProvider>
      <Toaster position="bottom-right" theme="dark" />
      <Routes>
        <Route path="/" element={<Picker />} />
        {Object.keys(loaders).map((id) => (
          <Route key={id} path={`/${id}`} element={<ExperiencePage id={id} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </TooltipProvider>
    </HashRouter>
  );
}
