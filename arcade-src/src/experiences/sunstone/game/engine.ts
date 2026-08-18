import * as THREE from "three";
import { GameAudio } from "./audio";
import { moveWithCollision } from "./collision";
import {
  cellToWorld,
  generateMaze,
  openingYaw,
  worldToCell,
  type Maze,
} from "./maze";
import { readBestTime, writeBestTime, useGameStore } from "./store";
import type { HudSnapshot, Phase } from "./types";
import { buildWorld, type World } from "./world";

const EYE = 1.62;
const RADIUS = 0.36;
const WALK = 4.35;
const SPRINT = 6.85;
const ACCEL = 22;
const FRICTION = 16;
const LOOK_SENS = 0.00215;
const TOUCH_LOOK = 0.0034;
const PAD_LOOK = 1.7;
const STEP = 1 / 60;

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "KeyR",
]);

export type EngineHandle = {
  dispose: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  setTouchMove: (x: number, y: number) => void;
  addTouchLook: (dx: number, dy: number) => void;
  requestLock: () => void;
};

function formatHud(partial: Partial<HudSnapshot>) {
  useGameStore.getState().setHud(partial);
}

export function createEngine(
  canvas: HTMLCanvasElement,
  minimap: HTMLCanvasElement,
): EngineHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x8ec4e0, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc5dce8, 22, 72);

  const camera = new THREE.PerspectiveCamera(78, 1, 0.08, 140);
  camera.rotation.order = "YXZ";

  const hemi = new THREE.HemisphereLight(0xcfe4f5, 0xc4b396, 0.9);
  scene.add(hemi);
  scene.add(new THREE.AmbientLight(0xfff4e8, 0.32));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.08);
  sun.position.set(22, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  const audio = new GameAudio();
  const keys = new Set<string>();
  let keyOverride: Set<string> | null = null;
  const touchMove = { x: 0, y: 0 };
  let lookDX = 0;
  let lookDY = 0;

  let maze: Maze = generateMaze();
  let world: World = buildWorld(scene, maze);

  const player = {
    x: 0,
    y: EYE,
    z: 0,
    yaw: 0,
    pitch: 0,
    vx: 0,
    vz: 0,
    dist: 0,
  };

  let phase: Phase = "title";
  let time = 0;
  let collected = 0;
  let bestTime = readBestTime();
  let isNewBest = false;
  let pointerLocked = false;
  const isCoarse =
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);

  let acc = 0;
  let last = performance.now();
  let hudClock = 0;
  let disposed = false;
  let punch = 0;

  const bursts: {
    mesh: THREE.InstancedMesh;
    life: number;
    vel: THREE.Vector3[];
  }[] = [];
  const burstGeo = new THREE.OctahedronGeometry(0.05, 0);
  const burstMat = new THREE.MeshBasicMaterial({ color: 0x8eecd8 });
  const burstDummy = new THREE.Object3D();
  const burstMat4 = new THREE.Matrix4();
  const burstPos = new THREE.Vector3();
  const burstQuat = new THREE.Quaternion();
  const burstScale = new THREE.Vector3();

  function spawnBurst(x: number, y: number, z: number) {
    const count = 12;
    const mesh = new THREE.InstancedMesh(burstGeo, burstMat, count);
    const vel: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      burstDummy.position.set(x, y, z);
      burstDummy.scale.setScalar(1);
      burstDummy.updateMatrix();
      mesh.setMatrixAt(i, burstDummy.matrix);
      vel.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          1.4 + Math.random() * 2.4,
          (Math.random() - 0.5) * 4,
        ),
      );
    }
    scene.add(mesh);
    bursts.push({ mesh, life: 0.5, vel });
  }

  function placePlayerAtStart() {
    const w = cellToWorld(maze, maze.start.cx, maze.start.cy);
    player.x = w.x;
    player.z = w.z;
    player.y = EYE;
    player.yaw = openingYaw(maze, maze.start.cx, maze.start.cy);
    player.pitch = 0;
    player.vx = 0;
    player.vz = 0;
    player.dist = 0;
  }

  function rebuild(next: Maze) {
    world.dispose();
    maze = next;
    world = buildWorld(scene, maze);
    collected = 0;
    time = 0;
    isNewBest = false;
    placePlayerAtStart();
    pushHud(true);
  }

  function held(code: string) {
    if (keyOverride) return keyOverride.has(code);
    return keys.has(code);
  }

  function readActions() {
    let mx = 0;
    let my = 0;
    if (held("KeyW") || held("ArrowUp")) my += 1;
    if (held("KeyS") || held("ArrowDown")) my -= 1;
    if (held("KeyD") || held("ArrowRight")) mx += 1;
    if (held("KeyA") || held("ArrowLeft")) mx -= 1;
    mx += touchMove.x;
    my += touchMove.y;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
    if (pads) {
      for (const pad of pads) {
        if (!pad || pad.mapping !== "standard") continue;
        const lx = pad.axes[0] ?? 0;
        const ly = pad.axes[1] ?? 0;
        const mag = Math.hypot(lx, ly);
        const dz = 0.16;
        if (mag > dz) {
          const scale = ((mag - dz) / (1 - dz)) / mag;
          mx += lx * scale;
          my += -ly * scale;
        }
        const rx = pad.axes[2] ?? 0;
        const ry = pad.axes[3] ?? 0;
        const rmag = Math.hypot(rx, ry);
        if (rmag > dz) {
          const scale = ((rmag - dz) / (1 - dz)) / rmag;
          lookDX -= rx * scale * PAD_LOOK * 16;
          lookDY -= ry * scale * PAD_LOOK * 16;
        }
        if (pad.buttons[9]?.pressed && phase === "playing") pause();
      }
    }

    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }
    const sprint = held("ShiftLeft") || held("ShiftRight");
    return { mx, my, sprint };
  }

  function applyLook() {
    if (lookDX === 0 && lookDY === 0) return;
    player.yaw -= lookDX * LOOK_SENS;
    player.pitch -= lookDY * LOOK_SENS;
    const lim = Math.PI / 2 - 0.08;
    player.pitch = Math.max(-lim, Math.min(lim, player.pitch));
    lookDX = 0;
    lookDY = 0;
  }

  function step(dt: number) {
    if (phase !== "playing") return;
    applyLook();
    const { mx, my, sprint } = readActions();
    const speedMax = sprint ? SPRINT : WALK;
    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    const rx = Math.cos(player.yaw);
    const rz = -Math.sin(player.yaw);
    const wishX = fx * my + rx * mx;
    const wishZ = fz * my + rz * mx;
    const wishMag = Math.hypot(wishX, wishZ);
    const targetX = wishMag > 0 ? (wishX / wishMag) * speedMax : 0;
    const targetZ = wishMag > 0 ? (wishZ / wishMag) * speedMax : 0;
    const rate = wishMag > 0 ? ACCEL : FRICTION;
    player.vx += (targetX - player.vx) * Math.min(1, rate * dt);
    player.vz += (targetZ - player.vz) * Math.min(1, rate * dt);

    const moved = moveWithCollision(
      player.x,
      player.z,
      player.vx * dt,
      player.vz * dt,
      RADIUS,
      world.wallIndex,
    );
    if (moved.hit) {
      const sp = Math.hypot(player.vx, player.vz);
      if (sp > 2.4) punch = Math.min(0.045, punch + 0.018);
      if (Math.abs(moved.x - player.x) < 0.0001) player.vx = 0;
      if (Math.abs(moved.z - player.z) < 0.0001) player.vz = 0;
    }
    player.x = moved.x;
    player.z = moved.z;
    const sp = Math.hypot(player.vx, player.vz);
    player.dist += sp * dt;
    time += dt;
    audio.footstep(dt, sp, speedMax);

    for (const gem of world.gems) {
      if (gem.taken) continue;
      const dx = player.x - gem.x;
      const dz = player.z - gem.z;
      if (dx * dx + dz * dz < 0.85 * 0.85) {
        gem.taken = true;
        gem.mesh.visible = false;
        collected += 1;
        audio.collect();
        spawnBurst(gem.x, 1.0, gem.z);
      }
    }

    const ex = player.x - world.exit.x;
    const ez = player.z - world.exit.z;
    if (ex * ex + ez * ez < 1.15 * 1.15) {
      win();
    }

    const cell = worldToCell(maze, player.x, player.z);
    markExplored(cell.cx, cell.cy);
  }

  const explored = new Uint8Array(64 * 64);
  function resetExplored() {
    explored.fill(0);
    markExplored(maze.start.cx, maze.start.cy);
  }
  function markExplored(cx: number, cy: number) {
    const idx = cy * maze.cols + cx;
    if (explored[idx]) return;
    explored[idx] = 1;
    const cell = maze.cells[cy]![cx]!;
    if (!cell.n && cy > 0) explored[(cy - 1) * maze.cols + cx] = 1;
    if (!cell.s && cy < maze.rows - 1) explored[(cy + 1) * maze.cols + cx] = 1;
    if (!cell.w && cx > 0) explored[cy * maze.cols + (cx - 1)] = 1;
    if (!cell.e && cx < maze.cols - 1) explored[cy * maze.cols + (cx + 1)] = 1;
  }

  function win() {
    if (phase !== "playing") return;
    phase = "won";
    audio.win();
    const backX = Math.sin(player.yaw);
    const backZ = Math.cos(player.yaw);
    player.x += backX * 1.7;
    player.z += backZ * 1.7;
    player.pitch = -0.08;
    if (document.pointerLockElement) document.exitPointerLock();
    if (bestTime === null || time < bestTime) {
      isNewBest = true;
      bestTime = time;
      writeBestTime(time);
    }
    pushHud(true);
  }

  function start() {
    audio.unlock();
    if (phase === "title" || phase === "won" || phase === "paused") {
      if (phase === "won") {
        rebuild(generateMaze());
        resetExplored();
      }
      phase = "playing";
      if (!isCoarse) requestLock();
      pushHud(true);
    }
  }

  function pause() {
    if (phase !== "playing") return;
    phase = "paused";
    if (document.pointerLockElement) document.exitPointerLock();
    pushHud(true);
  }

  function resume() {
    if (phase !== "paused") return;
    phase = "playing";
    if (!isCoarse) requestLock();
    pushHud(true);
  }

  function restart() {
    audio.unlock();
    rebuild(generateMaze());
    resetExplored();
    phase = "playing";
    if (!isCoarse) requestLock();
    pushHud(true);
  }

  function requestLock() {
    const opts = { unadjustedMovement: true } as PointerLockOptions;
    const p = canvas.requestPointerLock(opts) as Promise<void> | void;
    if (p && typeof (p as Promise<void>).catch === "function") {
      (p as Promise<void>).catch(() => {
        canvas.requestPointerLock();
      });
    }
  }

  function pushHud(force = false) {
    hudClock = force ? 0 : hudClock;
    formatHud({
      phase,
      time,
      collected,
      total: maze.gems.length,
      bestTime,
      isNewBest,
      pointerLocked,
      isCoarse,
    });
  }

  function applyCamera(now: number) {
    if (phase === "title") {
      const w = cellToWorld(maze, maze.start.cx, maze.start.cy);
      const yaw0 = openingYaw(maze, maze.start.cx, maze.start.cy);
      const sway = Math.sin(now * 0.00035) * 0.18;
      const fx = -Math.sin(yaw0);
      const fz = -Math.cos(yaw0);
      camera.position.set(w.x - fx * 1.15, 1.68, w.z - fz * 1.15);
      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw0 + sway;
      camera.rotation.x = -0.06 + Math.sin(now * 0.0005) * 0.03;
      camera.rotation.z = 0;
      return;
    }
    const bob =
      phase === "playing"
        ? Math.sin(player.dist * 9.2) *
          0.032 *
          Math.min(1, Math.hypot(player.vx, player.vz) / WALK)
        : 0;
    punch *= 0.86;
    camera.position.set(player.x, EYE + bob, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch + punch;
    camera.rotation.z = bob * 0.35;
  }

  function tickGems(dt: number, now: number) {
    for (const gem of world.gems) {
      if (gem.taken) continue;
      gem.mesh.position.y = 0.95 + Math.sin(now * 0.003 + gem.id) * 0.12;
      gem.mesh.rotation.y += dt * 1.35;
    }
    for (const cloud of world.clouds) {
      cloud.position.x += dt * 0.35;
      if (cloud.position.x > 50) cloud.position.x = -30;
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]!;
      b.life -= dt;
      for (let k = 0; k < b.vel.length; k++) {
        b.mesh.getMatrixAt(k, burstMat4);
        burstMat4.decompose(burstPos, burstQuat, burstScale);
        burstPos.addScaledVector(b.vel[k]!, dt);
        const fade = Math.max(0.01, b.life / 0.5);
        burstDummy.position.copy(burstPos);
        burstDummy.scale.setScalar(fade);
        burstDummy.rotation.y += dt * 6;
        burstDummy.updateMatrix();
        b.mesh.setMatrixAt(k, burstDummy.matrix);
      }
      b.mesh.instanceMatrix.needsUpdate = true;
      if (b.life <= 0) {
        scene.remove(b.mesh);
        b.mesh.dispose();
        bursts.splice(i, 1);
      }
    }
  }

  function drawMinimap() {
    const ctx = minimap.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const css = 168;
    const target = Math.floor(css * dpr);
    if (minimap.width !== target) {
      minimap.width = target;
      minimap.height = target;
    }
    const w = minimap.width;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, w);
    ctx.fillStyle = "rgba(18, 20, 26, 0.78)";
    roundRect(ctx, 0.5, 0.5, w - 1, w - 1, 16 * dpr);
    ctx.fill();

    const pad = 16 * dpr;
    const inner = w - pad * 2;
    const worldW = maze.cols * maze.cellSize;
    const worldD = maze.rows * maze.cellSize;
    const scale = inner / Math.max(worldW, worldD);
    const ox = pad + (inner - worldW * scale) / 2;
    const oz = pad + (inner - worldD * scale) / 2;
    const snap = (n: number) => Math.round(n) + 0.5;
    const toX = (x: number) => ox + (x + maze.cellSize / 2) * scale;
    const toY = (z: number) => oz + (z + maze.cellSize / 2) * scale;
    const known = (cx: number, cy: number) =>
      cx >= 0 &&
      cy >= 0 &&
      cx < maze.cols &&
      cy < maze.rows &&
      explored[cy * maze.cols + cx] === 1;

    for (let y = 0; y < maze.rows; y++) {
      for (let x = 0; x < maze.cols; x++) {
        if (!known(x, y)) continue;
        ctx.fillStyle = "rgba(232, 226, 214, 0.16)";
        ctx.fillRect(
          toX(x * maze.cellSize - maze.cellSize / 2),
          toY(y * maze.cellSize - maze.cellSize / 2),
          maze.cellSize * scale,
          maze.cellSize * scale,
        );
      }
    }

    ctx.strokeStyle = "rgba(242, 239, 232, 0.82)";
    ctx.lineWidth = Math.max(1, 1.25 * dpr);
    ctx.lineCap = "square";
    ctx.beginPath();
    for (let y = 0; y <= maze.rows; y++) {
      for (let x = 0; x < maze.cols; x++) {
        const present = y < maze.rows ? maze.cells[y]![x]!.n : maze.cells[maze.rows - 1]![x]!.s;
        if (!present) continue;
        if (!(known(x, y) || known(x, y - 1))) continue;
        const z = y * maze.cellSize - maze.cellSize / 2;
        ctx.moveTo(snap(toX(x * maze.cellSize - maze.cellSize / 2)), snap(toY(z)));
        ctx.lineTo(snap(toX(x * maze.cellSize + maze.cellSize / 2)), snap(toY(z)));
      }
    }
    for (let y = 0; y < maze.rows; y++) {
      for (let x = 0; x <= maze.cols; x++) {
        const present = x < maze.cols ? maze.cells[y]![x]!.w : maze.cells[y]![maze.cols - 1]!.e;
        if (!present) continue;
        if (!(known(x, y) || known(x - 1, y))) continue;
        const wx = x * maze.cellSize - maze.cellSize / 2;
        ctx.moveTo(snap(toX(wx)), snap(toY(y * maze.cellSize - maze.cellSize / 2)));
        ctx.lineTo(snap(toX(wx)), snap(toY(y * maze.cellSize + maze.cellSize / 2)));
      }
    }
    ctx.stroke();

    for (const gem of world.gems) {
      const cell = worldToCell(maze, gem.x, gem.z);
      if (!known(cell.cx, cell.cy)) continue;
      ctx.fillStyle = gem.taken ? "rgba(157, 160, 168, 0.4)" : "#3dceb0";
      ctx.beginPath();
      ctx.arc(toX(gem.x), toY(gem.z), 2.6 * dpr, 0, Math.PI * 2, false);
      ctx.fill();
    }

    if (known(maze.exit.cx, maze.exit.cy)) {
      const s = 4.5 * dpr;
      ctx.strokeStyle = "#4ad4c8";
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(toX(world.exit.x) - s, toY(world.exit.z) - s, s * 2, s * 2);
    }

    ctx.save();
    ctx.translate(toX(player.x), toY(player.z));
    ctx.rotate(player.yaw);
    ctx.fillStyle = "#f2efe8";
    ctx.beginPath();
    ctx.moveTo(0, -6.5 * dpr);
    ctx.lineTo(4.4 * dpr, 5.4 * dpr);
    ctx.lineTo(0, 3 * dpr);
    ctx.lineTo(-4.4 * dpr, 5.4 * dpr);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function resize() {
    const parent = canvas.parentElement ?? canvas;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function frame(now: number) {
    if (disposed) return;
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(raw, 0.1);
    acc += dt;
    acc = Math.min(acc, 0.25);
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    tickGems(dt, now);
    applyCamera(now);
    renderer.render(scene, camera);
    drawMinimap();
    hudClock += dt;
    if (hudClock > 0.12) {
      hudClock = 0;
      if (phase === "playing") pushHud();
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) {
      if (GAME_CODES.has(e.code) && phase === "playing") e.preventDefault();
      return;
    }
    keys.add(e.code);
    if (GAME_CODES.has(e.code) && (phase === "playing" || phase === "paused")) e.preventDefault();
    if (e.code === "Escape" && phase === "playing") {
      pause();
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }
  function onBlur() {
    keys.clear();
    keyOverride = null;
  }
  function onMouseMove(e: MouseEvent) {
    if (!pointerLocked || phase !== "playing") return;
    lookDX += e.movementX;
    lookDY += e.movementY;
  }
  function onLockChange() {
    pointerLocked = document.pointerLockElement === canvas;
    formatHud({ pointerLocked });
    if (!pointerLocked && phase === "playing" && !isCoarse) {
      pause();
    }
  }
  function onVisibility() {
    if (document.hidden && phase === "playing") pause();
  }
  function onClick() {
    if (phase === "playing" && !pointerLocked && !isCoarse) requestLock();
  }

  placePlayerAtStart();
  resetExplored();
  resize();
  pushHud(true);
  renderer.setAnimationLoop(frame);

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("pointerlockchange", onLockChange);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", onClick);

  window.__controlsTest = {
    getYaw: () => player.yaw,
    getSpeed: () => Math.hypot(player.vx, player.vz),
    getPosition: () => ({ x: player.x, y: player.y, z: player.z }),
    setKeys: (codes) => {
      keyOverride = codes.length ? new Set(codes) : null;
    },
    setYaw: (yaw) => {
      player.yaw = yaw;
    },
    setPosition: (x, y, z) => {
      player.x = x;
      player.y = y;
      player.z = z;
      player.vx = 0;
      player.vz = 0;
    },
    startGame: () => {
      if (phase === "title" || phase === "won" || phase === "paused") {
        phase = "playing";
        pushHud(true);
      }
    },
    getPhase: () => phase,
    getExit: () => ({ x: world.exit.x, z: world.exit.z }),
  };

  return {
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerlockchange", onLockChange);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      world.dispose();
      burstGeo.dispose();
      burstMat.dispose();
      renderer.dispose();
      if (window.__controlsTest) delete window.__controlsTest;
    },
    start,
    pause,
    resume,
    restart,
    setTouchMove(x, y) {
      touchMove.x = x;
      touchMove.y = y;
    },
    addTouchLook(dx, dy) {
      if (phase !== "playing") return;
      lookDX += dx * (TOUCH_LOOK / LOOK_SENS);
      lookDY += dy * (TOUCH_LOOK / LOOK_SENS);
    },
    requestLock,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
