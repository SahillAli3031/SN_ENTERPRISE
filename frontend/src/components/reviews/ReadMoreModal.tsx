import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { StarRating } from "../ui/StarRating";

interface ReadMoreModalProps {
  open: boolean;
  onClose: () => void;
  review?: {
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
  };
}

const formatDate = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
};

/** Accessible modal showing the full review text. */
export function ReadMoreModal({ open, onClose, review }: ReadMoreModalProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeOnEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, closeOnEscape]);

  if (!open || !review) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-charcoal/55 p-4 backdrop-blur-[2px] sm:p-6"
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-detail-title"
          onClick={(event) => event.stopPropagation()}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl bg-soft-white p-6 shadow-lift outline-none sm:p-9 rounded-[8px] border border-line"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-line text-warm-gray transition-colors hover:border-forest hover:text-forest"
          >
            <X size={16} />
          </button>

          <h2 id="review-detail-title" className="display-heading mt-0 text-2xl text-forest sm:text-3xl">
            {review.name}'s Review
          </h2>

          <div className="mt-3 flex flex-col gap-4">
            <div className="flex items-center gap-4 border-t border-t border-line pt-4">
              <StarRating
                rating={review.rating}
                size={20}
                className="flex-shrink-0"
              />
              <span className="text-xs text-warm-gray">{formatDate(review.createdAt)}</span>
            </div>
            <p className="mt-4 leading-relaxed text-charcoal">
              "{review.comment}"
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full bg-forest px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-forest-dark"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}