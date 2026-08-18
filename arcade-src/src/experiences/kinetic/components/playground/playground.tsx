import { PlaygroundHud } from "@/experiences/kinetic/components/playground/hud";
import { PlaygroundCanvas } from "@/experiences/kinetic/components/playground/world";

export function Playground() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div className="absolute inset-0">
        <PlaygroundCanvas />
      </div>
      <PlaygroundHud />
    </main>
  );
}
