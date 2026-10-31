import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitReview } from "../../api/reviews";
import { Spinner } from "../ui/Spinner";
import { StarRating } from "../ui/StarRating";
import { cn } from "../../lib/cn";

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(60, "Name is too long."),
  email: z.email("Please enter a valid email address."),
  rating: z
    .number({ message: "Please choose a star rating." })
    .min(1, "Please choose a star rating.")
    .max(5, "Rating must be between 1 and 5."),
  comment: z
    .string()
    .trim()
    .min(10, "Please share at least 10 characters about your experience.")
    .max(1200, "Please keep your review under 1200 characters."),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Called only after the API confirms the review was stored. */
  onSubmitted?: () => void;
}

const fieldClasses =
  "w-full rounded-[6px] border border-line bg-ivory px-4 py-3 text-sm text-charcoal transition-colors placeholder:text-warm-gray/70 focus:border-forest focus:outline-none";

/** Accessible modal containing the review submission form. */
export function ReviewFormModal({ open, onClose, onSubmitted }: ReviewFormModalProps) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { name: "", email: "", rating: 0, comment: "" },
    mode: "onTouched",
  });

  const rating = watch("rating");

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setMessage("");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onSubmit = async (values: ReviewFormValues) => {
    setStatus("loading");
    setMessage("");
    try {
      await submitReview(values);
      setStatus("success");
      onSubmitted?.();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Your review could not be sent. Please try again.",
      );
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-charcoal/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            onClick={(event) => event.stopPropagation()}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg bg-soft-white p-6 shadow-lift outline-none sm:p-9"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-line text-warm-gray transition-colors hover:border-forest hover:text-forest"
            >
              <X size={16} />
            </button>

            <span className="eyebrow">Share your experience</span>
            <h2 id="review-dialog-title" className="display-heading mt-4 text-2xl text-forest sm:text-3xl">
              Write a Review
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-warm-gray">
              Your review will appear publicly after submission.
            </p>

            {status === "success" ? (
              <div className="mt-7 rounded-[6px] border border-forest/25 bg-sage p-5">
                <div className="flex items-start gap-3">
                  <CircleCheck size={20} className="mt-0.5 shrink-0 text-forest" />
                  <div>
                    <p className="text-sm font-semibold text-forest">Thank You for Your Feedback!</p>
                    <p className="mt-1 text-sm text-warm-gray">
                      Your review has been submitted successfully. We truly appreciate you taking the time to share your experience with S N Enterprise.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 rounded-full bg-forest px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-forest-dark"
                >
                  OK
                </button>
              </div>
            ) : (
              <form
                className="mt-7 space-y-5"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div>
                  <label htmlFor="review-rating" className="mb-2 block text-sm font-medium text-charcoal">
                    Rating <span className="text-terracotta">*</span>
                  </label>
                  <StarRating
                    id="review-rating"
                    interactive
                    rating={rating}
                    onChange={(value) => setValue("rating", value, { shouldDirty: true })}
                  />
                  {errors.rating ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                      {errors.rating.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="review-name" className="mb-2 block text-sm font-medium text-charcoal">
                      Your name <span className="text-terracotta">*</span>
                    </label>
                    <input
                      id="review-name"
                      className={cn(fieldClasses, errors.name && "border-terracotta")}
                      autoComplete="name"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                    {errors.name ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                        {errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="review-email" className="mb-2 block text-sm font-medium text-charcoal">
                      Email <span className="text-terracotta">*</span>
                    </label>
                    <input
                      id="review-email"
                      type="email"
                      className={cn(fieldClasses, errors.email && "border-terracotta")}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    {errors.email ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                        {errors.email.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="-mt-2 text-xs text-warm-gray">
                  Your email is never published — it helps us verify the review.
                </p>

                <div>
                  <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-charcoal">
                    Your review <span className="text-terracotta">*</span>
                  </label>
                  <textarea
                    id="review-comment"
                    rows={5}
                    className={cn(fieldClasses, "resize-y", errors.comment && "border-terracotta")}
                    aria-invalid={!!errors.comment}
                    {...register("comment")}
                  />
                  {errors.comment ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                      {errors.comment.message}
                    </p>
                  ) : null}
                </div>

                {status === "error" ? (
                  <div className="flex items-start gap-2.5 rounded-[6px] border border-terracotta/40 bg-terracotta/10 p-4">
                    <CircleAlert size={17} className="mt-0.5 shrink-0 text-terracotta-dark" />
                    <p className="text-sm text-terracotta-dark">{message}</p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-terracotta px-8 py-3.5 text-[0.75rem] font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "loading" ? <Spinner size={17} /> : "Submit Review"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
