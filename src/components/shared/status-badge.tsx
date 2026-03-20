import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/constants";

const statusStyles: Record<OrderStatus, string> = {
  requested: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface StatusBadgeProps {
  status: OrderStatus;
  label: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {label}
    </span>
  );
}
