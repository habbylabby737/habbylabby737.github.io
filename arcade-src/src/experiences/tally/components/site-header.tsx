import { Link } from "react-router-dom";
import { signOut } from "@/shared/auth";
import { useCurrentUserState } from "@/shared/auth";
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

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-md bg-elevated"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <Link
        to="/"
        className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-elevated hover:text-fg"
      >
        Sign in
      </Link>
    );
  }

  const label = user.displayName ?? user.primaryEmail ?? "Account";

  return (
    <div className="flex min-w-0 items-center gap-2">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
        />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-elevated text-xs font-medium text-fg">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-sm font-medium text-fg sm:inline">
        {label}
      </span>
      {!user.isDevFallback && (
        <button
          type="button"
          onClick={() => void signOut()}
          className="h-11 px-2 text-sm text-muted transition-colors duration-[var(--motion-quick)] hover:text-fg"
        >
          Sign out
        </button>
      )}
    </div>
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
      <Link
        to="/"
        className="flex items-center gap-2 text-fg transition-opacity duration-[var(--motion-quick)] hover:opacity-80"
      >
        <TallyMark className="size-5" />
        <span className="font-display text-lg font-medium tracking-tight">
          Tally
        </span>
      </Link>
      <AuthSlot />
    </header>
  );
}
