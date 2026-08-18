import { useEffect, useRef } from "react";
import "./extra.css";
import { FieldChrome } from "./components/field-chrome";
import { ParticleCanvas } from "./components/particle-canvas";
import type { ParticleField } from "./lib/field/engine";
import { useFieldStore } from "./lib/field/store";

export default function Helix() {
  const engineRef = useRef<ParticleField | null>(null);
  const resetDefaults = useFieldStore((s) => s.resetDefaults);

  useEffect(() => {
    void useFieldStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "c" || e.key === "C") {
        engineRef.current?.clearTrails();
      } else if (e.key === "r" || e.key === "R") {
        resetDefaults();
        engineRef.current?.resetParticles();
      } else if (e.key === "s" || e.key === "S") {
        const field = engineRef.current;
        if (!field) return;
        const a = document.createElement("a");
        a.href = field.capture();
        a.download = `helix-${Date.now()}.png`;
        a.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetDefaults]);

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      <ParticleCanvas engineRef={engineRef} />
      <div className="field-vignette" />
      <FieldChrome engineRef={engineRef} />
    </main>
  );
}
