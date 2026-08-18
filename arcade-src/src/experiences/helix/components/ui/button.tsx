import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-fg hover:bg-accent/90 active:scale-[0.96]",
        secondary:
          "bg-raised text-fg shadow-[0_0_0_1px_var(--color-border)] hover:bg-raised/80 active:scale-[0.96]",
        ghost:
          "bg-transparent text-fg hover:bg-fg/8 active:scale-[0.96]",
        outline:
          "bg-transparent text-fg shadow-[0_0_0_1px_var(--color-border)] hover:bg-fg/6 active:scale-[0.96]",
        danger:
          "bg-transparent text-fg shadow-[0_0_0_1px_var(--color-border)] hover:bg-danger/15 hover:text-danger active:scale-[0.96]",
      },
      size: {
        default: "h-11 rounded-md px-4 text-sm",
        sm: "h-9 rounded-sm px-3 text-sm",
        lg: "h-12 rounded-lg px-5 text-sm",
        icon: "size-11 rounded-md",
        "icon-sm": "size-9 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        "transition-[scale,background-color,color,box-shadow,opacity] duration-150 ease-out",
        className,
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
