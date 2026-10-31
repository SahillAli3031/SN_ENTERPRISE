import { useCallback, useEffect, useState } from "react";
import { CircleAlert, PencilLine, RefreshCw } from "lucide-react";
import { fetchPublishedReviews } from "../api/reviews";
import { ReviewFormModal } from "../components/reviews/ReviewFormModal";
import { ReadMoreModal } from "../components/reviews/ReadMoreModal";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Spinner } from "../components/ui/Spinner";
import { StarRating } from "../components/ui/StarRating";
import type { Review } from "../types";

interface ReviewsSectionProps {
  /** Maximum number of reviews to display. */
  limit?: number;
}

type Status = "loading" | "success" | "error";

/** Customer reviews loaded from the API, with loading/error/empty states. */
export function ReviewsSection({ limit }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [readMoreReview, setReadMoreReview] = useState<Review | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await fetchPublishedReviews();
      setReviews(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = typeof limit === "number" ? reviews.slice(0, limit) : reviews;
  const average =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0;

  return (
    <section id="reviews" className="border-t border-line bg-ivory py-20 sm:py-24">
      <div className="page-container">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Customer Reviews"
            title="What clients say after the last coat."
            description="Every review below was submitted through our site and published by our team."
            className="max-w-xl"
          />

          <Reveal delay={0.1} className="flex flex-col items-start gap-5 md:items-end">
            <div className="flex items-center gap-4 border border-line bg-soft-white px-5 py-4">
              <span className="font-serif text-4xl leading-none text-forest">
                {status === "success" && reviews.length > 0 ? average.toFixed(1) : "—"}
              </span>
              <div>
                <StarRating rating={average} size={15} />
                <p className="mt-1.5 text-xs text-warm-gray">
                  {reviews.length} published review{reviews.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Button onClick={() => setModalOpen(true)}>
              <PencilLine size={15} />
              Write a Review
            </Button>
          </Reveal>
        </div>

        <div className="mt-12">
          {status === "loading" ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-[6px] border border-line bg-soft-white p-7"
                >
                  <div className="h-4 w-28 rounded bg-sage" />
                  <div className="mt-5 h-3.5 w-full rounded bg-sage" />
                  <div className="mt-3 h-3.5 w-5/6 rounded bg-sage" />
                  <div className="mt-3 h-3.5 w-2/3 rounded bg-sage" />
                  <div className="mt-7 h-3 w-32 rounded bg-sage" />
                </div>
              ))}
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-start gap-4 border border-terracotta/40 bg-soft-white p-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CircleAlert size={19} className="mt-0.5 shrink-0 text-terracotta-dark" />
                <div>
                  <p className="font-semibold text-forest">Reviews are temporarily unavailable</p>
                  <p className="mt-1 text-sm text-warm-gray">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-full border border-forest/35 px-5 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:bg-forest hover:text-ivory"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="border border-dashed border-line bg-soft-white px-6 py-14 text-center">
              <p className="font-serif text-2xl text-forest">No published reviews yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-warm-gray">
                Once customers share their experience, their approved reviews will appear here.
                Yours could be the first.
              </p>
              <div className="mt-7 flex justify-center">
                <Button onClick={() => setModalOpen(true)} variant="outline">
                  <PencilLine size={15} />
                  Write a Review
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3" style={{ minHeight: 280 }}>
              {visible.map((review) => (
                <ReviewCard key={review.id} review={review} onReadMore={setReadMoreReview} />
              ))}
            </div>
          )}
        </div>

        {status === "success" && reviews.length > (limit ?? Infinity) ? (
          <div className="mt-10 flex justify-center">
            <Button to="/reviews" variant="outline">
              View All Reviews
            </Button>
          </div>
        ) : null}
      </div>

      <ReviewFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmitted={load} />
      <ReadMoreModal open={!!readMoreReview} onClose={() => setReadMoreReview(null)} review={readMoreReview ?? undefined} />
      {status === "loading" && reviews.length === 0 ? <Spinner className="sr-only" /> : null}
    </section>
  );
}
