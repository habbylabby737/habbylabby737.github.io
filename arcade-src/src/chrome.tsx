import { Link } from "react-router-dom";
import { experienceById } from "./catalog";

export function ArcadeChrome({ id }: { id: string }) {
  const item = experienceById(id);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-start p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        to="/"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-bg/80 px-3 py-2 text-xs tracking-[0.16em] text-fg uppercase backdrop-blur-md hover:bg-surface"
      >
        <span aria-hidden>←</span>
        Arcade
        {item ? <span className="hidden text-muted sm:inline">/ {item.title}</span> : null}
      </Link>
    </div>
  );
}
