import * as React from "react";
import { Label as LabelPrimitive } from "@radix-ui/react-label";
import { cn } from "@/shared/cn";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive>) {
  return (
    <LabelPrimitive
      className={cn("text-sm font-medium text-fg", className)}
      {...props}
    />
  );
}

export { Label };
