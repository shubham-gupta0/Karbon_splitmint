import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, size = "default" }) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2
        className={cn(
          "animate-spin text-primary-500",
          sizeClasses[size],
          className,
        )}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-sm text-neutral-500">Loading...</p>
      </div>
    </div>
  );
}
