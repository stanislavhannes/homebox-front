import { cn } from "@/lib/utils";

type Status = "available" | "partial" | "unavailable";

const styles: Record<Status, string> = {
  available:
    "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25",
  partial:
    "bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25",
  unavailable:
    "bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25",
};

const dots: Record<Status, string> = {
  available: "bg-emerald-500",
  partial: "bg-amber-500",
  unavailable: "bg-rose-500",
};

export function AvailabilityBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dots[status])} />
      {label}
    </span>
  );
}
