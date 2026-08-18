export type Category = "Games" | "Explore" | "Toys" | "Studio" | "Tools";

export type Experience = {
  id: string;
  title: string;
  blurb: string;
  hint: string;
  category: Category;
};

export const CATEGORIES: Category[] = ["Games", "Explore", "Toys", "Studio", "Tools"];

export const EXPERIENCES: Experience[] = [
  {
    id: "wakepoint",
    title: "Wakepoint",
    blurb: "Hold the orbit. Cut through waves before the signal dies.",
    hint: "WASD move · click to fire · Esc pause",
    category: "Games",
  },
  {
    id: "sunstone",
    title: "Sunstone",
    blurb: "A first-person sandstone maze. Collect stones. Find the gate.",
    hint: "WASD walk · mouse look · Shift sprint",
    category: "Games",
  },
  {
    id: "solar-orrery",
    title: "Orrery",
    blurb: "Fly the solar system. Focus a world. Scrub time.",
    hint: "Drag orbit · scroll zoom · 0–8 jump",
    category: "Explore",
  },
  {
    id: "apsides",
    title: "Apsides",
    blurb: "Fling worlds and watch them orbit, slingshot, and merge.",
    hint: "Drag to launch · mass chips · scenes",
    category: "Explore",
  },
  {
    id: "kinetic",
    title: "Kinetic",
    blurb: "Drop stone, clay, and steel into a pit. Throw what stacks.",
    hint: "Click to drop · drag to throw · P pause",
    category: "Explore",
  },
  {
    id: "still",
    title: "Still",
    blurb: "A living water surface. Drag and the waves remember.",
    hint: "Drag to disturb · Space clears",
    category: "Toys",
  },
  {
    id: "drift",
    title: "Drift",
    blurb: "Filaments ride a living curl-noise field.",
    hint: "Space pause · R randomize · E export",
    category: "Toys",
  },
  {
    id: "helix",
    title: "Helix",
    blurb: "A particle field that swirls toward your hand.",
    hint: "Move to stir · C clear · S save",
    category: "Toys",
  },
  {
    id: "sylva",
    title: "Sylva",
    blurb: "Grow a fractal tree and let the wind move through it.",
    hint: "R new tree · G replay growth",
    category: "Toys",
  },
  {
    id: "dotfield",
    title: "Dotfield",
    blurb: "A 16-color pixel workshop. Draw, fill, export.",
    hint: "B pencil · E eraser · ⌘S export",
    category: "Studio",
  },
  {
    id: "cast",
    title: "Cast",
    blurb: "Five colors. Lock what you like. Shuffle the rest.",
    hint: "Space shuffle · 1–5 lock · E export",
    category: "Studio",
  },
  {
    id: "signal-synth",
    title: "Signal",
    blurb: "An analog-style synth with keys, filter, and scope.",
    hint: "A–L keys · Z/X octave · Space sustain",
    category: "Studio",
  },
  {
    id: "tally",
    title: "Tally",
    blurb: "Write a question. Vote once. Watch the bars move.",
    hint: "Local room · one vote · reset anytime",
    category: "Tools",
  },
  {
    id: "still-timer",
    title: "Still Timer",
    blurb: "One calm Pomodoro. One task marked Now.",
    hint: "Space start · R reset",
    category: "Tools",
  },
];

export function experienceById(id: string) {
  return EXPERIENCES.find((item) => item.id === id);
}
