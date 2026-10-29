import { Star } from "lucide-react";
import { cn } from "../../lib/cn";

interface StarRatingProps {
  /** 0–5 (fractional values supported for averages). */
  rating: number;
  size?: number;
  className?: string;
  /** Renders selectable stars with a radio group. */
  interactive?: boolean;
  name?: string;
  onChange?: (value: number) => void;
  id?: string;
}

/** Accessible star rating used for display and input. */
export function StarRating({
  rating,
  size = 16,
  className,
  interactive = false,
  name = "rating",
  onChange,
  id,
}: StarRatingProps) {
  if (interactive) {
    return (
      <div
        id={id}
        role="radiogroup"
        aria-label="Rating out of 5"
        className={cn("flex items-center gap-1.5", className)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            className="group cursor-pointer rounded-sm p-0.5 transition-transform hover:-translate-y-0.5"
            title={`${value} star${value > 1 ? "s" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={rating === value}
              onChange={() => onChange?.(value)}
              className="sr-only"
            />
            <Star
              size={size + 8}
              strokeWidth={1.5}
              className={cn(
                "transition-colors",
                rating >= value
                  ? "fill-terracotta text-terracotta"
                  : "fill-transparent text-warm-gray/50 group-hover:text-terracotta/70",
              )}
            />
            <span className="sr-only">{value} stars</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const fillPercent = Math.min(Math.max(rating - (value - 1), 0), 1) * 100;
        return (
          <span key={value} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              size={size}
              strokeWidth={1.5}
              className="absolute inset-0 fill-transparent text-warm-gray/45"
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
              aria-hidden="true"
            >
              <Star
                size={size}
                strokeWidth={1.5}
                className="fill-terracotta text-terracotta"
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}
