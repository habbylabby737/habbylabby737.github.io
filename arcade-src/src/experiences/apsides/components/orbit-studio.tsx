import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eraser, Pause, Play, RotateCcw, Sparkles, Target } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/shared/auth";
import { useCurrentUserState } from "@/shared/auth";
import { playFling, playMerge, playPlace, unlockAudio } from "@/experiences/apsides/lib/orbit/audio";
import { drawFrame, makeStars, type Star } from "@/experiences/apsides/lib/orbit/draw";
import {
  FLING_SCALE,
  MASS_PRESETS,
  SCENES,
  createBody,
  fitSceneCamera,
  screenToWorld,
  type Camera,
  type LaunchGhost,
  type MassKind,
  type OrbitWorld as OrbitWorldType,
  type SceneId,
  OrbitWorld,
  presetById,
} from "@/experiences/apsides/lib/orbit/sim";
import { Button } from "@/experiences/apsides/components/ui/button";
import { Slider } from "@/experiences/apsides/components/ui/slider";
import { cn } from "@/shared/cn";

const MASS_TONE: Record<MassKind, string> = {
  dust: "bg-mass-dust size-1.5",
  moon: "bg-mass-moon size-2",
  planet: "bg-mass-planet size-2.5",
  giant: "bg-mass-giant size-3.5",
  star: "bg-mass-star size-4",
};

export function OrbitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<OrbitWorldType | null>(null);
  const camRef = useRef<Camera>(fitSceneCamera("system"));
  const starsRef = useRef<Star[]>([]);
  const ghostRef = useRef<LaunchGhost | null>(null);
  const launchRef = useRef<{ x: number; y: number; pid: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const spaceRef = useRef(false);
  const lastTs = useRef(0);
  const reducedMotion = useRef(false);

  const [scene, setScene] = useState<SceneId>("system");
  const [preset, setPreset] = useState<MassKind>("planet");
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [trails, setTrails] = useState(true);
  const [follow, setFollow] = useState(false);
  const [count, setCount] = useState(0);
  const [full, setFull] = useState(false);
  const [hint, setHint] = useState(false);

  const syncWorld = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    world.paused = paused;
    world.timeScale = timeScale;
    world.trailsEnabled = trails;
    world.followCom = follow;
  }, [paused, timeScale, trails, follow]);

  useEffect(() => {
    syncWorld();
  }, [syncWorld]);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const world = new OrbitWorld();
    world.reset("system");
    worldRef.current = world;
    starsRef.current = makeStars(160);
    setCount(world.bodies.length);
    return undefined;
  }, []);

  const loadScene = useCallback((id: SceneId) => {
    const world = worldRef.current;
    if (!world) return;
    world.reset(id);
    camRef.current = fitSceneCamera(id);
    setScene(id);
    setCount(world.bodies.length);
    setFull(false);
    setHint(id === "void");
    ghostRef.current = null;
  }, []);

  const clearField = useCallback(() => {
    worldRef.current?.clear();
    ghostRef.current = null;
    setCount(0);
    setFull(false);
    setHint(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onNativeWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const pt = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      const before = screenToWorld(pt.x, pt.y, camRef.current, rect.width, rect.height);
      const factor = Math.exp(-ev.deltaY * 0.0012);
      camRef.current.zoom = Math.min(4.5, Math.max(0.18, camRef.current.zoom * factor));
      const after = screenToWorld(pt.x, pt.y, camRef.current, rect.width, rect.height);
      camRef.current.x += before.x - after.x;
      camRef.current.y += before.y - after.y;
    };
    canvas.addEventListener("wheel", onNativeWheel, { passive: false });

    let raf = 0;
    const loop = (ts: number) => {
      const world = worldRef.current;
      if (!world) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const prev = lastTs.current || ts;
      const dt = (ts - prev) / 1000;
      lastTs.current = ts;
      world.step(dt);

      if (world.followCom && world.bodies.length) {
        const com = world.centerOfMass();
        const cam = camRef.current;
        const k = 1 - Math.exp(-3.2 * Math.min(dt, 0.1));
        cam.x += (com.x - cam.x) * k;
        cam.y += (com.y - cam.y) * k;
      }

      if (world.collisions.length) {
        for (const c of world.collisions) playMerge(c.mass);
        setCount(world.bodies.length);
      }

      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const shake = world.trauma * world.trauma;
      const shakeAmp = reducedMotion.current ? 0 : 14 * shake;
      const t = ts * 0.01;
      drawFrame(ctx, {
        world,
        cam: camRef.current,
        width: rect.width,
        height: rect.height,
        dpr,
        stars: starsRef.current,
        ghost: ghostRef.current,
        shakeX: Math.sin(t * 17.1) * shakeAmp,
        shakeY: Math.cos(t * 13.7) * shakeAmp,
        alpha: 1,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("wheel", onNativeWheel);
    };
  }, []);

  const clientPoint = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const toWorld = (sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return screenToWorld(sx, sy, camRef.current, rect.width, rect.height);
  };

  const updateGhost = (sx: number, sy: number) => {
    const launch = launchRef.current;
    const world = worldRef.current;
    if (!launch || !world) return;
    const a = toWorld(launch.x, launch.y);
    const b = toWorld(sx, sy);
    const vx = (b.x - a.x) * FLING_SCALE;
    const vy = (b.y - a.y) * FLING_SCALE;
    const p = presetById(preset);
    ghostRef.current = world.predictLaunch(a.x, a.y, vx, vy, p.mass, p.color);
  };

  const endLaunch = (sx: number, sy: number, cancel = false) => {
    const launch = launchRef.current;
    const world = worldRef.current;
    launchRef.current = null;
    ghostRef.current = null;
    if (!launch || !world || cancel) return;
    const a = toWorld(launch.x, launch.y);
    const b = toWorld(sx, sy);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const p = presetById(preset);
    const vx = dist < 6 ? 0 : dx * FLING_SCALE;
    const vy = dist < 6 ? 0 : dy * FLING_SCALE;
    const ok = world.addBody(createBody(a.x, a.y, vx, vy, p.mass, p.color, p.id));
    setCount(world.bodies.length);
    setFull(!ok);
    if (ok) {
      setHint(false);
      if (dist < 6) playPlace();
      else playFling(dist);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    unlockAudio();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pt = clientPoint(e);
    const isPan =
      e.button === 1 ||
      e.button === 2 ||
      e.shiftKey ||
      spaceRef.current ||
      pointersRef.current.size >= 2;

    if (pointersRef.current.size === 2) {
      launchRef.current = null;
      ghostRef.current = null;
      const pts = [...pointersRef.current.values()];
      const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      pinchRef.current = { dist: d, zoom: camRef.current.zoom };
      panRef.current = {
        x: (pts[0]!.x + pts[1]!.x) * 0.5,
        y: (pts[0]!.y + pts[1]!.y) * 0.5,
        cx: camRef.current.x,
        cy: camRef.current.y,
      };
      return;
    }

    if (isPan) {
      panRef.current = { x: pt.x, y: pt.y, cx: camRef.current.x, cy: camRef.current.y };
      return;
    }
    if (e.button !== 0) return;
    launchRef.current = { x: pt.x, y: pt.y, pid: e.pointerId };
    updateGhost(pt.x, pt.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const pt = clientPoint(e);

    if (pointersRef.current.size === 2 && pinchRef.current && panRef.current) {
      const pts = [...pointersRef.current.values()];
      const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      const midX = (pts[0]!.x + pts[1]!.x) * 0.5;
      const midY = (pts[0]!.y + pts[1]!.y) * 0.5;
      const canvas = canvasRef.current;
      if (canvas && pinchRef.current.dist > 0) {
        const next = pinchRef.current.zoom * (d / pinchRef.current.dist);
        camRef.current.zoom = Math.min(4.5, Math.max(0.18, next));
        const rect = canvas.getBoundingClientRect();
        const dx = midX - rect.left - panRef.current.x;
        const dy = midY - rect.top - panRef.current.y;
        camRef.current.x = panRef.current.cx - dx / camRef.current.zoom;
        camRef.current.y = panRef.current.cy - dy / camRef.current.zoom;
      }
      return;
    }

    if (panRef.current && !launchRef.current) {
      const dx = pt.x - panRef.current.x;
      const dy = pt.y - panRef.current.y;
      camRef.current.x = panRef.current.cx - dx / camRef.current.zoom;
      camRef.current.y = panRef.current.cy - dy / camRef.current.zoom;
      return;
    }
    if (launchRef.current) updateGhost(pt.x, pt.y);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    const pt = clientPoint(e);
    if (launchRef.current && launchRef.current.pid === e.pointerId) {
      endLaunch(pt.x, pt.y);
    }
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) panRef.current = null;
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (e.repeat) return;
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
        e.preventDefault();
        spaceRef.current = true;
        setPaused((p) => !p);
      }
      if (e.key === "1") setPreset("dust");
      if (e.key === "2") setPreset("moon");
      if (e.key === "3") setPreset("planet");
      if (e.key === "4") setPreset("giant");
      if (e.key === "5") setPreset("star");
      if (e.key === "c" || e.key === "C") clearField();
      if (e.key === "t" || e.key === "T") setTrails((v) => !v);
      if (e.key === "f" || e.key === "F") setFollow((v) => !v);
      if (e.key === "r" || e.key === "R") loadScene(scene);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [clearField, loadScene, scene]);

  const { isPending } = useCurrentUserState();

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="block h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="pointer-events-auto max-w-sm rounded-xl bg-surface/80 px-4 py-3 shadow-panel backdrop-blur-sm">
          <p className="font-display text-2xl leading-tight tracking-tight text-fg">Apsides</p>
          <p className="mt-0.5 text-xs text-muted">Drag to fling a world. Watch it fall.</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl bg-surface/80 px-3 py-2 shadow-panel backdrop-blur-sm sm:flex">
            <span className="font-mono text-xs tabular-nums text-muted">{count} bodies</span>
            <span className="text-subtle">·</span>
            <span className="font-mono text-xs tabular-nums text-muted">{timeScale.toFixed(2)}×</span>
          </div>
          {isPending ? (
            <div className="size-11 animate-pulse rounded-xl bg-surface-2" />
          ) : (
            <>
              <SignedOut>
                <Button variant="outline" size="sm" className="rounded-xl bg-surface/80 px-3" asChild>
                  <Link to="/">Sign in</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <div className="rounded-xl bg-surface/80 px-2 py-1 shadow-panel backdrop-blur-sm [&_button]:text-muted">
                  <UserButton />
                </div>
              </SignedIn>
            </>
          )}
        </div>
      </header>

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center">
          <p className="font-display text-3xl tracking-tight text-fg/90">Drag to fling</p>
          <p className="mt-2 text-sm text-muted">Release to launch · tap to place still</p>
        </div>
      )}

      {full && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 text-center">
          <p className="text-sm text-muted">Field is full — clear a few worlds</p>
        </div>
      )}

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
        <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-2 rounded-xl bg-surface/85 p-2 shadow-panel backdrop-blur-sm sm:p-3">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
              {MASS_PRESETS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPreset(m.id)}
                  aria-label={m.label}
                  aria-pressed={preset === m.id}
                  className={cn(
                    "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-medium transition-[background-color,box-shadow,color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                    preset === m.id
                      ? "bg-surface-2 text-fg shadow-border"
                      : "text-muted hover:bg-surface-2/70 hover:text-fg",
                  )}
                >
                  <span className={cn("block rounded-full", MASS_TONE[m.id])} />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant={paused ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume" : "Pause"}
              >
                {paused ? <Play className="ml-px" /> : <Pause />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => loadScene(scene)} aria-label="Reset scene">
                <RotateCcw />
              </Button>
              <Button variant="danger" size="icon-sm" onClick={clearField} aria-label="Clear all">
                <Eraser />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {SCENES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadScene(s.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-lg px-3 text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]",
                    scene === s.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="shrink-0 text-xs text-muted">Time</span>
              <Slider
                min={0.15}
                max={6}
                step={0.05}
                value={[timeScale]}
                onValueChange={(v) => setTimeScale(v[0] ?? 1)}
                aria-label="Time scale"
              />
              <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted">
                {timeScale.toFixed(2)}×
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={trails ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTrails((v) => !v)}
                aria-pressed={trails}
                aria-label="Toggle trails"
              >
                <Sparkles />
                <span className="hidden sm:inline">Trails</span>
              </Button>
              <Button
                variant={follow ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFollow((v) => !v)}
                aria-pressed={follow}
                aria-label="Follow center of mass"
              >
                <Target />
                <span className="hidden sm:inline">Follow</span>
              </Button>
            </div>
          </div>

          <p className="hidden px-1 text-xs text-subtle sm:block">
            Scroll to zoom · Shift-drag or right-drag to pan · Space pauses · 1–5 pick mass
          </p>
        </div>
      </footer>
    </div>
  );
}
