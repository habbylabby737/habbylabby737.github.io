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
    </header>
  );
}
