import { cn } from "../../lib/cn";

export type StatusBadgeTone =
  | "pending"
  | "approved"
  | "hidden"
  | "new"
  | "contacted"
  | "closed"
  | "published"
  | "unpublished";

const toneClasses: Record<StatusBadgeTone, string> = {
  pending: "border-terracotta/35 bg-terracotta/12 text-terracotta-dark",
  approved: "border-forest/25 bg-sage text-forest",
  hidden: "border-warm-gray/35 bg-warm-gray/15 text-warm-gray",
  new: "border-terracotta/35 bg-terracotta/12 text-terracotta-dark",
  contacted: "border-forest/25 bg-sage text-forest",
  closed: "border-warm-gray/35 bg-warm-gray/15 text-warm-gray",
  published: "border-forest/25 bg-sage text-forest",
  unpublished: "border-warm-gray/35 bg-warm-gray/15 text-warm-gray",
};

interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
  className?: string;
}

/** Compact status pill used across the admin tables. */
export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.14em] uppercase",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
