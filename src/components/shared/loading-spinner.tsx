import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes: Record<string, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizes[size],
        className
      )}
    />
  );
}
