import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/shared/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg shadow-border hover:bg-fg",
        secondary: "bg-bg-subtle text-fg shadow-border hover:bg-bg-elevated",
        ghost: "text-fg-muted hover:bg-bg-subtle hover:text-fg",
        outline: "bg-transparent text-fg shadow-border hover:bg-bg-subtle",
        danger: "bg-danger text-fg hover:opacity-90",
      },
      size: {
        default: "h-11 rounded-md px-4 text-sm",
        sm: "h-9 rounded-sm px-3 text-sm",
        lg: "h-12 rounded-md px-5 text-sm",
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

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size }),
          "transition-[scale,background-color,color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96]",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
