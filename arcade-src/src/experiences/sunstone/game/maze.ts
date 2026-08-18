import type { CellWalls, Maze } from "./types";

export type { Maze };

const DIRS = [
  { dx: 0, dy: -1, wall: "n" as const, opp: "s" as const },
  { dx: 1, dy: 0, wall: "e" as const, opp: "w" as const },
  { dx: 0, dy: 1, wall: "s" as const, opp: "n" as const },
  { dx: -1, dy: 0, wall: "w" as const, opp: "e" as const },
];

function emptyCell(): CellWalls {
  return { n: true, e: true, s: true, w: true };
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
  return arr;
}

function inBounds(cols: number, rows: number, x: number, y: number) {
  return x >= 0 && y >= 0 && x < cols && y < rows;
}

export function passages(maze: Maze, cx: number, cy: number) {
  const cell = maze.cells[cy]![cx]!;
  const out: { cx: number; cy: number }[] = [];
  if (!cell.n && inBounds(maze.cols, maze.rows, cx, cy - 1)) out.push({ cx, cy: cy - 1 });
  if (!cell.e && inBounds(maze.cols, maze.rows, cx + 1, cy)) out.push({ cx: cx + 1, cy });
  if (!cell.s && inBounds(maze.cols, maze.rows, cx, cy + 1)) out.push({ cx, cy: cy + 1 });
  if (!cell.w && inBounds(maze.cols, maze.rows, cx - 1, cy)) out.push({ cx: cx - 1, cy });
  return out;
}

function wallCount(cell: CellWalls) {
  return Number(cell.n) + Number(cell.e) + Number(cell.s) + Number(cell.w);
}

function bfsFarthest(maze: Maze, sx: number, sy: number) {
  const dist = Array.from({ length: maze.rows }, () =>
    Array<number>(maze.cols).fill(-1),
  );
  const q: { x: number; y: number }[] = [{ x: sx, y: sy }];
  dist[sy]![sx] = 0;
  let far = { x: sx, y: sy, d: 0 };
  while (q.length) {
    const cur = q.shift()!;
    const d = dist[cur.y]![cur.x]!;
    if (d > far.d) far = { x: cur.x, y: cur.y, d };
    for (const n of passages(maze, cur.x, cur.y)) {
      if (dist[n.cy]![n.cx] === -1) {
        dist[n.cy]![n.cx] = d + 1;
        q.push({ x: n.cx, y: n.cy });
      }
    }
  }
  return { far, dist };
}

export function cellToWorld(maze: Maze, cx: number, cy: number) {
  return { x: cx * maze.cellSize, z: cy * maze.cellSize };
}

export function worldToCell(maze: Maze, x: number, z: number) {
  const cx = Math.round(x / maze.cellSize);
  const cy = Math.round(z / maze.cellSize);
  return {
    cx: Math.max(0, Math.min(maze.cols - 1, cx)),
    cy: Math.max(0, Math.min(maze.rows - 1, cy)),
  };
}

export function openingYaw(maze: Maze, cx: number, cy: number) {
  const cell = maze.cells[cy]![cx]!;
  if (!cell.n) return 0;
  if (!cell.e) return -Math.PI / 2;
  if (!cell.s) return Math.PI;
  if (!cell.w) return Math.PI / 2;
  return 0;
}

export function generateMaze(
  cols = 13,
  rows = 13,
  cellSize = 4.1,
): Maze {
  const cells: CellWalls[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyCell()),
  );
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const stack = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  visited[stack[0]!.y]![stack[0]!.x] = true;

  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const neighbors = shuffle(
      DIRS.map((d) => ({ ...d, x: cur.x + d.dx, y: cur.y + d.dy })).filter(
        (n) => inBounds(cols, rows, n.x, n.y) && !visited[n.y]![n.x],
      ),
    );
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const n = neighbors[0]!;
    cells[cur.y]![cur.x]![n.wall] = false;
    cells[n.y]![n.x]![n.opp] = false;
    visited[n.y]![n.x] = true;
    stack.push({ x: n.x, y: n.y });
  }

  // A few extra openings so the maze has loops, not a single corridor.
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x + 1 < cols && cells[y]![x]!.e && Math.random() < 0.11) {
        cells[y]![x]!.e = false;
        cells[y]![x + 1]!.w = false;
      }
      if (y + 1 < rows && cells[y]![x]!.s && Math.random() < 0.11) {
        cells[y]![x]!.s = false;
        cells[y + 1]![x]!.n = false;
      }
    }
  }

  const maze: Maze = {
    cols,
    rows,
    cellSize,
    wallThickness: 0.42,
    wallHeight: 2.55,
    cells,
    start: { cx: 0, cy: 0 },
    exit: { cx: cols - 1, cy: rows - 1 },
    gems: [],
  };

  const dead: { cx: number; cy: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (wallCount(cells[y]![x]!) === 3) dead.push({ cx: x, cy: y });
    }
  }
  const startPick = dead[Math.floor(Math.random() * Math.max(1, dead.length))] ?? {
    cx: 0,
    cy: 0,
  };
  maze.start = startPick;
  const { far } = bfsFarthest(maze, startPick.cx, startPick.cy);
  maze.exit = { cx: far.x, cy: far.y };

  const used = new Set([`${maze.start.cx},${maze.start.cy}`, `${maze.exit.cx},${maze.exit.cy}`]);
  const gemCells: { cx: number; cy: number; id: number }[] = [];
  for (const d of shuffle(dead.slice())) {
    const key = `${d.cx},${d.cy}`;
    if (used.has(key)) continue;
    used.add(key);
    gemCells.push({ cx: d.cx, cy: d.cy, id: gemCells.length });
    if (gemCells.length >= 8) break;
  }
  const extras = 10 - gemCells.length;
  if (extras > 0) {
    const pool: { cx: number; cy: number }[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const key = `${x},${y}`;
        if (!used.has(key)) pool.push({ cx: x, cy: y });
      }
    }
    shuffle(pool);
    for (let i = 0; i < extras && i < pool.length; i++) {
      const p = pool[i]!;
      gemCells.push({ cx: p.cx, cy: p.cy, id: gemCells.length });
    }
  }
  maze.gems = gemCells;
  return maze;
}

export type WallSeg = { x: number; z: number; horizontal: boolean };

export function collectWallSegments(maze: Maze): WallSeg[] {
  const segs: WallSeg[] = [];
  const { cols, rows, cells, cellSize } = maze;
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x < cols; x++) {
      const present = y < rows ? cells[y]![x]!.n : cells[rows - 1]![x]!.s;
      if (!present) continue;
      segs.push({
        x: x * cellSize,
        z: y * cellSize - cellSize / 2,
        horizontal: true,
      });
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x <= cols; x++) {
      const present = x < cols ? cells[y]![x]!.w : cells[y]![cols - 1]!.e;
      if (!present) continue;
      segs.push({
        x: x * cellSize - cellSize / 2,
        z: y * cellSize,
        horizontal: false,
      });
    }
  }
  return segs;
}
