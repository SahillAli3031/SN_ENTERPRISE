import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, Images, Inbox, MessageSquareText, RotateCcw } from "lucide-react";
import { fetchEnquiries } from "../../api/enquiries";
import { fetchAllGallery } from "../../api/gallery";
import { fetchAdminReviews } from "../../api/reviews";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/ui/Spinner";
import { StarRating } from "../../components/ui/StarRating";
import { StatusBadge } from "../../components/admin/StatusBadge";
import type { AdminReview, Enquiry, GalleryItem } from "../../types";

interface DashboardData {
  reviews: AdminReview[];
  enquiries: Enquiry[];
  gallery: GalleryItem[];
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** /admin — overview of moderation and content queues. */
export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [reviews, enquiries, gallery] = await Promise.all([
        fetchAdminReviews(),
        fetchEnquiries(),
        fetchAllGallery(),
      ]);
      setData({ reviews, enquiries, gallery });
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn't load the dashboard. Please try again."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div>
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[8px] border border-terracotta/40 bg-terracotta/10 p-5 text-sm text-terracotta-dark"
        >
          <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={26} label="Loading dashboard…" />
      </div>
    );
  }

  const pendingReviews = data.reviews.filter((review) => review.status === "pending");
  const newEnquiries = data.enquiries.filter((enquiry) => enquiry.status === "new");
  const preview = pendingReviews.slice(0, 5);

  const cards = [
    { label: "Pending reviews", value: pendingReviews.length, to: "/admin/reviews" },
    { label: "New enquiries", value: newEnquiries.length, to: "/admin/enquiries" },
    { label: "Gallery items", value: data.gallery.length, to: "/admin/gallery" },
    { label: "Reviews on file", value: data.reviews.length, to: "/admin/reviews" },
  ];

  return (
    <div>
      <span className="eyebrow">Administration</span>
      <h1 className="display-heading mt-4 text-3xl text-forest sm:text-4xl">Dashboard</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm-gray">
        Everything waiting for your attention. Approved reviews are the only ones visible on the
        public site.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-[8px] border border-line bg-soft-white p-6 transition-colors hover:border-forest/40"
          >
            <p className="display-heading text-4xl text-forest">{card.value}</p>
            <p className="mt-2 text-[0.68rem] font-semibold tracking-[0.2em] text-terracotta uppercase">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-[8px] border border-line bg-soft-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <span className="eyebrow">Moderation queue</span>
            <h2 className="display-heading mt-3 text-xl text-forest">Waiting for approval</h2>
          </div>
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-2 rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <MessageSquareText size={14} aria-hidden="true" />
            Open moderation
          </Link>
        </div>

        {preview.length === 0 ? (
          <p className="px-6 py-8 text-sm text-warm-gray">
            Nothing is waiting — every submitted review has been handled.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {preview.map((review) => (
              <li key={review.id} className="flex flex-wrap items-start gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-forest">{review.name}</p>
                    <StarRating rating={review.rating} size={13} />
                    <StatusBadge tone="pending" label="Pending" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal">{review.comment}</p>
                </div>
                <p className="text-xs text-warm-gray">{formatDate(review.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/enquiries"
          className="flex items-center gap-3 rounded-[8px] border border-line bg-soft-white px-6 py-5 text-sm font-medium text-forest transition-colors hover:border-forest/40"
        >
          <Inbox size={18} className="text-terracotta" aria-hidden="true" />
          {newEnquiries.length} new {newEnquiries.length === 1 ? "enquiry" : "enquiries"} to follow up
        </Link>
        <Link
          to="/admin/gallery"
          className="flex items-center gap-3 rounded-[8px] border border-line bg-soft-white px-6 py-5 text-sm font-medium text-forest transition-colors hover:border-forest/40"
        >
          <Images size={18} className="text-terracotta" aria-hidden="true" />
          Manage {data.gallery.length} {data.gallery.length === 1 ? "gallery item" : "gallery items"}
        </Link>
      </div>
    </div>
  );
}
