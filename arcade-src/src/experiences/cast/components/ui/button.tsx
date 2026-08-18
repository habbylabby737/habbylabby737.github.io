import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/70 focus-visible:ring-offset-2 focus-visible:ring-offset-chrome disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-chrome shadow-[var(--shadow-border)] hover:bg-ink/90",
        ghost: "bg-transparent text-ink hover:bg-ink/10",
        outline:
          "bg-transparent text-ink shadow-[var(--shadow-border)] hover:bg-ink/10",
        inverse: "bg-chrome/15 text-current hover:bg-chrome/22",
      },
      size: {
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-xs",
        md: "h-10 rounded-[var(--radius-sm)] px-3.5 text-sm",
        lg: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
        icon: "size-11 rounded-[var(--radius-sm)]",
        chip: "h-8 rounded-full px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          buttonVariants({ variant, size }),
          "active:not-disabled:scale-[0.96]",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
