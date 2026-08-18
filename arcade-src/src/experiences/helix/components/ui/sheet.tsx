import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/shared/cn";

function Sheet({
  ...props
}: React.ComponentProps<typeof Drawer.Root>) {
  return <Drawer.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof Drawer.Trigger>) {
  return <Drawer.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof Drawer.Portal>) {
  return <Drawer.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Overlay>) {
  return (
    <Drawer.Overlay
      data-slot="sheet-overlay"
      className={cn("fixed inset-0 z-40 bg-bg/55", className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Drawer.Content>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-fg shadow-panel outline-none",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-fg/18" />
        {children}
      </Drawer.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("mb-4 flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      data-slot="sheet-title"
      className={cn("font-display text-xl leading-snug text-fg", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Description>) {
  return (
    <Drawer.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
