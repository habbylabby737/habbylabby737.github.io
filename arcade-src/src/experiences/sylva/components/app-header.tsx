import { Link } from "react-router-dom";
import { useCurrentUserState } from "@/shared/auth";
import { UserButton } from "@/shared/auth";

export function AppHeader() {
  return (
    <header className="pointer-events-none flex items-start justify-between gap-4">
      <div className="pointer-events-auto">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Generative grove
        </p>
        <h1 className="font-display text-4xl leading-none tracking-tight text-foreground italic md:text-5xl">
          Sylva
        </h1>
      </div>
      <AuthChip />
    </header>
  );
}

function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div
        className="pointer-events-none h-10 w-24 animate-pulse rounded-lg bg-secondary"
        aria-hidden
      />
    );
  }
  if (user) {
    return (
      <div className="pointer-events-auto max-w-48 truncate rounded-xl bg-card/90 px-2 py-1.5 shadow-[var(--shadow-border)]">
        <UserButton />
      </div>
    );
  }
  return (
    <Link
      to="/"
      className="pointer-events-auto inline-flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-[background-color] duration-150 hover:bg-accent"
    >
      Sign in
    </Link>
  );
}
