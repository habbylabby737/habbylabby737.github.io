import { cn } from "@/shared/cn";

function TallyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 5v14M10.5 5v14M15 5v14M4.5 16.5 19.5 7.5" />
    </svg>
  );
}

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-fg">
        <TallyMark className="size-5" />
        <span className="font-display text-lg font-medium tracking-tight">
          Tally
        </span>
      </div>
    </header>
  );
}
