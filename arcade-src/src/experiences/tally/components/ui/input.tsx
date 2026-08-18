import * as React from "react";
import { cn } from "@/shared/cn";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md bg-elevated px-3 text-base text-fg shadow-border outline-none transition-[box-shadow,background-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] placeholder:text-subtle hover:shadow-border-hover focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
