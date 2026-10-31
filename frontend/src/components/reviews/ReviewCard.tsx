import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { StarRating } from "../ui/StarRating";
import type { Review } from "../../types";

interface ReviewCardProps {
  review: Review;
  onReadMore: (review: Review) => void;
}

const MAX_LINES = 2;

export function ReviewCard({ review, onReadMore }: ReviewCardProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [showReadMore, setShowReadMore] = useState(false);

  useEffect(() => {
    if (!textRef.current) return;
    const el = textRef.current;
    setShowReadMore(el.scrollHeight > el.clientHeight);
  }, []);

  return (
    <article className="flex h-full flex-col border border-line bg-soft-white p-7 transition-colors duration-300 hover:border-forest/35">
      <div className="flex items-center justify-between gap-4">
        <StarRating rating={review.rating} size={16} />
        <span className="text-xs text-warm-gray whitespace-nowrap">{formatDate(review.createdAt)}</span>
      </div>
      <p
        ref={textRef}
        className="mt-5 flex-1 text-[0.95rem] leading-relaxed text-charcoal line-clamp-2"
        style={{ WebkitLineClamp: MAX_LINES }}
      >
        "{review.comment}"
      </p>
      {showReadMore && (
        <button
          type="button"
          onClick={() => onReadMore(review)}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-dark transition-colors"
        >
          Read more
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
      <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage font-serif text-sm text-forest">
          {review.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="font-serif text-lg text-forest">{review.name}</span>
      </div>
    </article>
  );
}

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}