import { Card } from "@/experiences/tally/components/ui/card";
import { PollBooth } from "@/experiences/tally/components/poll-booth";
import { PollComposer } from "@/experiences/tally/components/poll-composer";
import { SiteHeader } from "@/experiences/tally/components/site-header";
import { usePollStore } from "@/experiences/tally/lib/poll-store";

export function PollApp() {
  const poll = usePollStore((state) => state.poll);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <Card className="w-full">{poll ? <PollBooth /> : <PollComposer />}</Card>
      </main>
    </div>
  );
}
