import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls, useTexture } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { RigidBodyType } from "@dimforge/rapier3d-compat";
import {
  Color,
  MathUtils,
  Plane,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type DirectionalLight,
} from "three";
import { playThunk, unlockAudio } from "@/experiences/kinetic/lib/playground-audio";
import {
  ARENA_HALF,
  usePlayground,
  type BodySpec,
  type ShapeKind,
} from "@/experiences/kinetic/lib/playground-store";

const FIXED_STEP = 1 / 60;
const _hit = new Vector3();
const _camDir = new Vector3();
const _plane = new Plane();
const _vel = new Vector3();

export function PlaygroundCanvas() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [7.6, 6.1, 9.4], fov: 42, near: 0.15, far: 80 }}
      onPointerDown={() => unlockAudio()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <color attach="background" args={["#0c0c0d"]} />
      <fog attach="fog" args={["#0c0c0d", 18, 44]} />
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#c5ccd4", "#2a2620", 0.55]} />
      <KeyLight />
      <directionalLight position={[-7, 5, -6]} intensity={0.28} color="#9aa4b2" />
      <Suspense fallback={<ArenaFallback />}>
        <PhysicsWorld />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}

function KeyLight() {
  const ref = useRef<DirectionalLight>(null);
  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 40;
    light.shadow.camera.left = -12;
    light.shadow.camera.right = 12;
    light.shadow.camera.top = 12;
    light.shadow.camera.bottom = -12;
    light.shadow.bias = -0.00035;
  }, []);
  return (
    <directionalLight
      ref={ref}
      position={[10, 16, 8]}
      intensity={1.55}
      castShadow
      color="#f2ece0"
    />
  );
}

function CameraRig() {
  const dragging = usePlayground((s) => s.dragging);
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enabled={!dragging}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={4}
      maxDistance={22}
      target={[0, 1.15, 0]}
    />
  );
}

function PhysicsWorld() {
  const gravity = usePlayground((s) => s.gravity);
  const paused = usePlayground((s) => s.paused);
  const bodies = usePlayground((s) => s.bodies);

  return (
    <Physics
      gravity={[0, -gravity, 0]}
      timeStep={FIXED_STEP}
      interpolate
      paused={paused}
    >
      <Arena />
      {bodies.map((body) => (
        <PlayBody key={body.id} spec={body} />
      ))}
    </Physics>
  );
}

function ArenaFallback() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.95} metalness={0.04} />
      </mesh>
      <Rim />
    </group>
  );
}

function ArenaVisuals() {
  const floorMap = useTexture(`${import.meta.env.BASE_URL}textures/floor.jpg`);
  useLayoutEffect(() => {
    floorMap.wrapS = RepeatWrapping;
    floorMap.wrapT = RepeatWrapping;
    floorMap.repeat.set(5, 5);
    floorMap.anisotropy = 8;
    floorMap.colorSpace = SRGBColorSpace;
    floorMap.needsUpdate = true;
  }, [floorMap]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial
          map={floorMap}
          color="#8a8680"
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>
      <Grid
        args={[16, 16]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#2c2c30"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#3a3a40"
        fadeDistance={22}
        fadeStrength={1.2}
        infiniteGrid={false}
        position={[0, 0.012, 0]}
      />
      <ContactShadows
        position={[0, 0.011, 0]}
        opacity={0.42}
        scale={20}
        blur={2.4}
        far={8}
      />
      <Rim />
    </group>
  );
}

function Arena() {
  const spawn = usePlayground((s) => s.spawn);
  const selected = usePlayground((s) => s.selected);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);

  const onDown = (event: ThreeEvent<PointerEvent>) => {
    down.current = { x: event.clientX, y: event.clientY, t: performance.now() };
  };

  const onUp = (event: ThreeEvent<PointerEvent>) => {
    const start = down.current;
    down.current = null;
    if (!start) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved > 7 || performance.now() - start.t > 320) return;
    const p = event.point;
    spawn(selected, [
      MathUtils.clamp(p.x, -ARENA_HALF + 0.6, ARENA_HALF - 0.6),
      4.8,
      MathUtils.clamp(p.z, -ARENA_HALF + 0.6, ARENA_HALF - 0.6),
    ]);
  };

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={0.9} restitution={0.05}>
        <CuboidCollider args={[9, 0.4, 9]} position={[0, -0.4, 0]} />
        <Walls />
      </RigidBody>
      <group onPointerDown={onDown} onPointerUp={onUp}>
        <ArenaVisuals />
      </group>
    </>
  );
}

function Walls() {
  const h = 0.7;
  const t = 0.22;
  const s = ARENA_HALF + 0.15;
  return (
    <>
      <CuboidCollider args={[s + t, h, t]} position={[0, h, s]} />
      <CuboidCollider args={[s + t, h, t]} position={[0, h, -s]} />
      <CuboidCollider args={[t, h, s]} position={[s, h, 0]} />
      <CuboidCollider args={[t, h, s]} position={[-s, h, 0]} />
    </>
  );
}

function Rim() {
  const mat = useMemo(
    () => ({ color: "#1a1a1d", roughness: 0.55, metalness: 0.35 }),
    [],
  );
  const h = 0.55;
  const t = 0.22;
  const s = ARENA_HALF + 0.15;
  return (
    <group>
      <mesh position={[0, h, s]} castShadow receiveShadow>
        <boxGeometry args={[(s + t) * 2, h * 2, t * 2]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, h, -s]} castShadow receiveShadow>
        <boxGeometry args={[(s + t) * 2, h * 2, t * 2]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[s, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[t * 2, h * 2, s * 2]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[-s, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[t * 2, h * 2, s * 2]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

function PlayBody({ spec }: { spec: BodySpec }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0, z: 0, t: 0 });
  const restitution = usePlayground((s) => s.restitution);
  const setDragging = usePlayground((s) => s.setDragging);
  const remove = usePlayground((s) => s.remove);
  const { camera, gl } = useThree();

  useEffect(() => {
    const end = (event: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      setDragging(false);
      try {
        gl.domElement.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      const body = bodyRef.current;
      if (!body) return;
      body.setBodyType(RigidBodyType.Dynamic, true);
      const dt = Math.max((performance.now() - last.current.t) / 1000, 1 / 90);
      _vel.set(
        (body.translation().x - last.current.x) / dt,
        (body.translation().y - last.current.y) / dt,
        (body.translation().z - last.current.z) / dt,
      );
      const mag = Math.min(_vel.length(), 16);
      if (mag > 0.05) {
        _vel.normalize().multiplyScalar(mag);
        body.setLinvel({ x: _vel.x, y: _vel.y, z: _vel.z }, true);
      }
      document.body.style.cursor = "grab";
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [gl, setDragging]);

  useFrame((state) => {
    const body = bodyRef.current;
    if (!body) return;
    const t = body.translation();
    if (t.y < -10) {
      remove(spec.id);
      return;
    }
    if (!dragging.current) return;
    state.raycaster.setFromCamera(state.pointer, camera);
    camera.getWorldDirection(_camDir);
    _plane.setFromNormalAndCoplanarPoint(
      _camDir,
      _hit.set(last.current.x, last.current.y, last.current.z),
    );
    if (!state.raycaster.ray.intersectPlane(_plane, _hit)) return;
    _hit.x = MathUtils.clamp(_hit.x, -ARENA_HALF + 0.45, ARENA_HALF - 0.45);
    _hit.z = MathUtils.clamp(_hit.z, -ARENA_HALF + 0.45, ARENA_HALF - 0.45);
    _hit.y = MathUtils.clamp(_hit.y, 0.28, 7.2);
    last.current = { x: _hit.x, y: _hit.y, z: _hit.z, t: performance.now() };
    body.setNextKinematicTranslation(_hit);
  });

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const body = bodyRef.current;
    if (!body) return;
    unlockAudio();
    dragging.current = true;
    setDragging(true);
    document.body.style.cursor = "grabbing";
    gl.domElement.setPointerCapture(event.pointerId);
    const t = body.translation();
    last.current = { x: t.x, y: t.y + 0.18, z: t.z, t: performance.now() };
    body.setBodyType(RigidBodyType.KinematicPositionBased, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setNextKinematicTranslation({ x: t.x, y: t.y + 0.18, z: t.z });
  };

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={spec.position}
      rotation={spec.rotation}
      angularVelocity={spec.angularVelocity}
      restitution={restitution}
      friction={0.74}
      ccd
      linearDamping={0.12}
      angularDamping={0.18}
      canSleep
      onContactForce={({ totalForceMagnitude }) => {
        if (totalForceMagnitude > 22) {
          playThunk(Math.min(1, totalForceMagnitude / 180));
        }
      }}
    >
      <BodyCollider kind={spec.kind} restitution={restitution} />
      <group
        onPointerDown={onPointerDown}
        onPointerOver={() => {
          if (!dragging.current) document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          if (!dragging.current) document.body.style.cursor = "";
        }}
      >
        <BodyMesh kind={spec.kind} color={spec.color} />
      </group>
    </RigidBody>
  );
}

function BodyCollider({
  kind,
  restitution,
}: {
  kind: ShapeKind;
  restitution: number;
}) {
  const common = { restitution, friction: 0.74 };
  if (kind === "sphere") return <BallCollider args={[0.38]} {...common} />;
  if (kind === "cylinder") return <CylinderCollider args={[0.36, 0.32]} {...common} />;
  return <CuboidCollider args={[0.35, 0.35, 0.35]} {...common} />;
}

function BodyMesh({ kind, color }: { kind: ShapeKind; color: string }) {
  const tint = useMemo(() => new Color(color), [color]);
  if (kind === "sphere") {
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.38, 32, 24]} />
        <meshStandardMaterial
          color={tint}
          roughness={0.38}
          metalness={0.12}
          envMapIntensity={0.4}
        />
      </mesh>
    );
  }
  if (kind === "cylinder") {
    return (
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.72, 28]} />
        <meshStandardMaterial
          color={tint}
          roughness={0.28}
          metalness={0.72}
          envMapIntensity={0.55}
        />
      </mesh>
    );
  }
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial
        color={tint}
        roughness={0.86}
        metalness={0.02}
        envMapIntensity={0.25}
      />
    </mesh>
  );
}
