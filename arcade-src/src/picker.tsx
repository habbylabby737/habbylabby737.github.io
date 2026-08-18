import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, EXPERIENCES, type Category } from "./catalog";
import { cn } from "./shared/cn";

export function Picker() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EXPERIENCES.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!needle) return true;
      return `${item.title} ${item.blurb} ${item.hint} ${item.category}`
        .toLowerCase()
        .includes(needle);
    });
  }, [category, query]);

  return (
    <div className="arcade-home min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-10 sm:px-8 sm:py-16">
        <header className="max-w-2xl">
          <p className="text-xs tracking-[0.28em] text-muted uppercase">Fourteen rooms</p>
          <h1 className="font-display mt-3 text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
            Arcade
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            The Grok one-shots, cleaned up and gathered. Pick a room. Play. Come back.
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="arcade-search">
            Search
          </label>
          <input
            id="arcade-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, toys, studios…"
            className="h-12 w-full rounded-full border border-border bg-surface px-5 text-sm text-fg outline-none placeholder:text-subtle focus:border-border-strong sm:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {(["All", ...CATEGORIES] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={cn(
                  "h-10 rounded-full border px-4 text-xs tracking-[0.14em] uppercase",
                  category === name
                    ? "border-fg bg-fg text-primary-fg"
                    : "border-border bg-transparent text-muted hover:text-fg",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 space-y-12">
          {(category === "All" ? CATEGORIES : [category]).map((group) => {
            const cards = items.filter((item) => item.category === group);
            if (!cards.length) return null;
            return (
              <section key={group}>
                <h2 className="text-xs tracking-[0.22em] text-subtle uppercase">{group}</h2>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cards.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/${item.id}`}
                        className="group block h-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-elevated"
                      >
                        <p className="font-display text-2xl tracking-[-0.03em]">{item.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{item.blurb}</p>
                        <p className="mt-4 text-xs tracking-wide text-subtle">{item.hint}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {items.length === 0 ? (
          <p className="mt-16 text-sm text-muted">Nothing in that room. Try another word.</p>
        ) : null}

        <footer className="mt-16 flex flex-wrap gap-x-6 gap-y-2 text-xs text-subtle">
          <a className="hover:text-fg" href="https://habbylabby737.github.io/">
            The Way
          </a>
          <a className="hover:text-fg" href="https://habbylabby737.github.io/crossing/">
            Crossing
          </a>
        </footer>
      </div>
    </div>
  );
}
