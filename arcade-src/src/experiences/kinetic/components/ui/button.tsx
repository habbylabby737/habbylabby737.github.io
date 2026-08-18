import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background-color,color,transform,box-shadow] duration-150 ease-[var(--ease-out-soft)] select-none disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)]",
  {
    variants: {
      variant: {
        solid:
          "bg-accent text-accent-fg hover:bg-fg",
        ghost:
          "bg-transparent text-fg hover:bg-fg/8",
        quiet:
          "bg-fg/6 text-fg hover:bg-fg/10",
        danger:
          "bg-danger/15 text-fg hover:bg-danger/25",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-sm",
        md: "h-11 rounded-xl px-3.5 text-sm",
        icon: "size-11 rounded-xl",
        iconSm: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "quiet",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    pressed?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  pressed,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-pressed={pressed ? "true" : undefined}
      className={cn(
        buttonVariants({ variant, size }),
        pressed && "bg-fg text-bg hover:bg-fg",
        className,
      )}
      {...props}
    />
  );
}

export { buttonVariants };
