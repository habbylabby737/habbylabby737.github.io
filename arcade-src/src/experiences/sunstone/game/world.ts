import * as THREE from "three";
import { cellToWorld, collectWallSegments, type Maze } from "./maze";
import { buildWallIndex, segsToAabbs, type WallIndex } from "./collision";
import type { AABB } from "./types";

const COL = {
  wallA: 0xe8d4b6,
  wallB: 0xd7c19f,
  cap: 0xc56e52,
  pillar: 0xe2ceaf,
  trunk: 0x8a6548,
  leaves: 0x6aa56a,
  gem: 0x3dceb0,
  gemCore: 0xdffaf3,
  exit: 0x4ad4c8,
  ground: 0xb7c4a4,
};

export type GemView = {
  id: number;
  x: number;
  z: number;
  mesh: THREE.Group;
  taken: boolean;
};

export type World = {
  group: THREE.Group;
  wallIndex: WallIndex;
  walls: AABB[];
  gems: GemView[];
  exit: { x: number; z: number };
  clouds: THREE.Mesh[];
  lanterns: THREE.Object3D[];
  dispose: () => void;
};

function checkerTexture(cols: number, rows: number) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("2d");
  const n = 8;
  const t = size / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 === 0 ? "#dceee2" : "#f3eadc";
      g.fillRect(x * t, y * t, t + 0.5, t + 0.5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(cols / 2, rows / 2);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function skyDome() {
  const geo = new THREE.SphereGeometry(110, 24, 16);
  const colors = new Float32Array(geo.attributes.position!.count * 3);
  const pos = geo.attributes.position!;
  const top = new THREE.Color(0x7eb6dc);
  const hor = new THREE.Color(0xf0d2b0);
  const bot = new THREE.Color(0xc5d4b0);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 110;
    if (y > 0) tmp.copy(hor).lerp(top, Math.min(1, y * 1.15));
    else tmp.copy(hor).lerp(bot, Math.min(1, -y * 0.7));
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.scale(-1, 1, 1);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
}

function makeGem() {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshLambertMaterial({
      color: COL.gem,
      emissive: COL.gem,
      emissiveIntensity: 0.35,
    }),
  );
  const inner = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: COL.gemCore }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.025, 8, 20),
    new THREE.MeshLambertMaterial({
      color: COL.gem,
      emissive: COL.gem,
      emissiveIntensity: 0.2,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  g.add(outer, inner, ring);
  return g;
}

function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.9, 6),
    new THREE.MeshLambertMaterial({ color: COL.trunk }),
  );
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 1.35, 7),
    new THREE.MeshLambertMaterial({ color: COL.leaves, flatShading: true }),
  );
  leaves.position.y = 1.35;
  leaves.castShadow = true;
  g.add(trunk, leaves);
  return g;
}

export function buildWorld(scene: THREE.Scene, maze: Maze): World {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(obj: T) => {
    disposables.push(obj);
    return obj;
  };

  const segs = collectWallSegments(maze);
  const walls = segsToAabbs(maze, segs);
  const wallIndex = buildWallIndex(walls, maze.cellSize);

  const hSegs = segs.filter((s) => s.horizontal);
  const vSegs = segs.filter((s) => !s.horizontal);

  const wallGeo = track(
    new THREE.BoxGeometry(maze.cellSize + maze.wallThickness, maze.wallHeight, maze.wallThickness),
  );
  const capGeo = track(
    new THREE.BoxGeometry(
      maze.cellSize + maze.wallThickness + 0.08,
      0.12,
      maze.wallThickness + 0.08,
    ),
  );
  const wallMatA = track(new THREE.MeshLambertMaterial({ color: COL.wallA }));
  const wallMatB = track(new THREE.MeshLambertMaterial({ color: COL.wallB }));
  const capMat = track(new THREE.MeshLambertMaterial({ color: COL.cap }));

  const dummy = new THREE.Object3D();
  const placeWalls = (list: typeof hSegs, mat: THREE.Material, rotY: number) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(wallGeo, mat, list.length);
    const caps = new THREE.InstancedMesh(capGeo, capMat, list.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    caps.castShadow = true;
    for (let i = 0; i < list.length; i++) {
      const s = list[i]!;
      dummy.position.set(s.x, maze.wallHeight / 2, s.z);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      dummy.position.y = maze.wallHeight + 0.04;
      dummy.updateMatrix();
      caps.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
    group.add(mesh, caps);
  };
  placeWalls(hSegs, wallMatA, 0);
  placeWalls(vSegs, wallMatB, Math.PI / 2);

  const pillarGeo = track(new THREE.BoxGeometry(0.52, maze.wallHeight + 0.22, 0.52));
  const pillarMat = track(new THREE.MeshLambertMaterial({ color: COL.pillar }));
  const pCount = (maze.cols + 1) * (maze.rows + 1);
  const pillars = new THREE.InstancedMesh(pillarGeo, pillarMat, pCount);
  pillars.castShadow = true;
  let pi = 0;
  for (let y = 0; y <= maze.rows; y++) {
    for (let x = 0; x <= maze.cols; x++) {
      dummy.position.set(
        x * maze.cellSize - maze.cellSize / 2,
        (maze.wallHeight + 0.22) / 2,
        y * maze.cellSize - maze.cellSize / 2,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      pillars.setMatrixAt(pi++, dummy.matrix);
    }
  }
  pillars.instanceMatrix.needsUpdate = true;
  group.add(pillars);

  const floorTex = track(checkerTexture(maze.cols, maze.rows));
  const floorW = maze.cols * maze.cellSize + 1.2;
  const floorD = maze.rows * maze.cellSize + 1.2;
  const floor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(floorW, floorD)),
    track(new THREE.MeshLambertMaterial({ map: floorTex })),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(((maze.cols - 1) * maze.cellSize) / 2, 0, ((maze.rows - 1) * maze.cellSize) / 2);
  floor.receiveShadow = true;
  group.add(floor);

  const ground = new THREE.Mesh(
    track(new THREE.PlaneGeometry(180, 180)),
    track(new THREE.MeshLambertMaterial({ color: COL.ground })),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.position.set(floor.position.x, -0.02, floor.position.z);
  ground.receiveShadow = true;
  group.add(ground);

  const gems: GemView[] = maze.gems.map((g) => {
    const w = cellToWorld(maze, g.cx, g.cy);
    const mesh = makeGem();
    mesh.position.set(w.x, 0.95, w.z);
    group.add(mesh);
    return { id: g.id, x: w.x, z: w.z, mesh, taken: false };
  });

  const exitW = cellToWorld(maze, maze.exit.cx, maze.exit.cy);
  const portal = new THREE.Group();
  const pMat = track(
    new THREE.MeshLambertMaterial({
      color: COL.cap,
    }),
  );
  const colGeo = track(new THREE.BoxGeometry(0.28, 2.2, 0.28));
  const left = new THREE.Mesh(colGeo, pMat);
  const right = new THREE.Mesh(colGeo, pMat);
  left.position.set(-0.85, 1.1, 0);
  right.position.set(0.85, 1.1, 0);
  const lintel = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 0.24, 0.32)), pMat);
  lintel.position.set(0, 2.22, 0);
  const glow = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.5, 1.9)),
    track(
      new THREE.MeshBasicMaterial({
        color: COL.exit,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    ),
  );
  glow.position.set(0, 1.15, 0);
  const glowBack = glow.clone();
  glowBack.position.z = 0.02;
  portal.add(left, right, lintel, glow, glowBack);
  portal.position.set(exitW.x, 0, exitW.z);
  group.add(portal);

  const lanterns: THREE.Object3D[] = [];
  const lampMat = track(
    new THREE.MeshLambertMaterial({
      color: 0xffd7a8,
      emissive: 0xffc27a,
      emissiveIntensity: 0.7,
    }),
  );
  const poleMat = track(new THREE.MeshLambertMaterial({ color: 0x6b5344 }));
  let li = 0;
  for (const s of segs) {
    if (li > 14) break;
    if ((Math.abs(Math.round(s.x / maze.cellSize)) + Math.abs(Math.round(s.z / maze.cellSize))) % 5 !== 0)
      continue;
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 6)), poleMat);
    pole.position.y = 0.85;
    const bulb = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.16, 0.16)), lampMat);
    bulb.position.y = 1.72;
    lamp.add(pole, bulb);
    const inward = s.horizontal ? 0.28 : 0;
    const inz = s.horizontal ? 0 : 0.28;
    lamp.position.set(s.x + inward, 0, s.z + inz);
    group.add(lamp);
    lanterns.push(bulb);
    li++;
  }

  const trees: THREE.Group[] = [];
  const cx = ((maze.cols - 1) * maze.cellSize) / 2;
  const cz = ((maze.rows - 1) * maze.cellSize) / 2;
  const spanX = maze.cols * maze.cellSize;
  const spanZ = maze.rows * maze.cellSize;
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const rad = Math.max(spanX, spanZ) * 0.62 + 2 + (i % 3) * 1.4;
    const tree = makeTree();
    tree.position.set(cx + Math.cos(ang) * rad, 0, cz + Math.sin(ang) * rad);
    tree.rotation.y = ang;
    group.add(tree);
    trees.push(tree);
  }

  const clouds: THREE.Mesh[] = [];
  const cloudMat = track(new THREE.MeshLambertMaterial({ color: 0xf7f4ee }));
  const cloudGeo = track(new THREE.BoxGeometry(1, 1, 1));
  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.scale.set(4 + (i % 3) * 1.4, 0.7, 2.2 + (i % 2));
    cloud.position.set(
      cx + (i - 2.5) * 10,
      16 + (i % 3) * 1.4,
      cz + ((i * 7) % 20) - 10,
    );
    group.add(cloud);
    clouds.push(cloud);
  }

  const sky = skyDome();
  group.add(sky);

  scene.add(group);

  return {
    group,
    wallIndex,
    walls,
    gems,
    exit: { x: exitW.x, z: exitW.z },
    clouds,
    lanterns,
    dispose() {
      scene.remove(group);
      const seen = new Set<object>();
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (mesh.geometry && !seen.has(mesh.geometry)) {
          seen.add(mesh.geometry);
          mesh.geometry.dispose();
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (!m || seen.has(m)) continue;
          seen.add(m);
          const mapped = m as THREE.MeshLambertMaterial;
          if (mapped.map && !seen.has(mapped.map)) {
            seen.add(mapped.map);
            mapped.map.dispose();
          }
          m.dispose();
        }
      });
      for (const d of disposables) {
        if (!seen.has(d)) d.dispose();
      }
    },
  };
}
