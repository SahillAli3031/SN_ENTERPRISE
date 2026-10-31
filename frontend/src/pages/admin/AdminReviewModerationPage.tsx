import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Eye, EyeOff, Trash, type LucideIcon } from "lucide-react";
import { deleteReview, fetchAdminReviews, updateReviewStatus } from "../../api/reviews";
import { getErrorMessage } from "../../api/client";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { Spinner } from "../../components/ui/Spinner";
import { StarRating } from "../../components/ui/StarRating";
import type { AdminReview, ReviewStatus } from "../../types";

type Tab = "approved" | "hidden" | "all";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "approved", label: "Visible" },
  { key: "hidden", label: "Hidden" },
  { key: "all", label: "All" },
];

const statusLabels: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Visible",
  hidden: "Hidden",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface RowActionProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

function RowAction({ label, icon: Icon, onClick, disabled }: RowActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </button>
  );
}

interface ReviewAction {
  key: string;
  label: string;
  status: ReviewStatus;
  icon: LucideIcon;
}

function actionProps(review: AdminReview): ReviewAction[] {
  const actions: ReviewAction[] = [];
  if (review.status !== "hidden") {
    actions.push({
      key: "hide",
      label: `Hide review from ${review.name}`,
      status: "hidden",
      icon: EyeOff,
    });
  } else {
    actions.push({
      key: "unhide",
      label: `Unhide review from ${review.name}`,
      status: "approved",
      icon: Eye,
    });
  }
  return actions;
}

/** /admin/reviews — hide, unhide and delete customer reviews. */
export function AdminReviewModerationPage() {
  const [tab, setTab] = useState<Tab>("approved");
  const [rows, setRows] = useState<AdminReview[] | null>(null);
  /** Which tab `rows` belongs to — prevents showing stale rows from another tab. */
  const [loadedTab, setLoadedTab] = useState<Tab | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminReview | null>(null);

  const load = useCallback(async (activeTab: Tab) => {
    try {
      const reviews = await fetchAdminReviews(activeTab === "all" ? undefined : activeTab);
      setRows(reviews);
      setLoadedTab(activeTab);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn't load reviews. Please try again."));
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const applyStatus = async (review: AdminReview, status: ReviewStatus) => {
    setBusyId(review.id);
    try {
      await updateReviewStatus(review.id, status);
      await load(tab);
    } catch (caught) {
      setError(getErrorMessage(caught, "That change could not be saved. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  const removeReview = async (review: AdminReview) => {
    setBusyId(review.id);
    try {
      await deleteReview(review.id);
      await load(tab);
    } catch (caught) {
      setError(getErrorMessage(caught, "The review could not be deleted. Please try again."));
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

return (
    <div>
      <span className="eyebrow">Moderation</span>
      <h1 className="display-heading mt-4 text-3xl text-forest sm:text-4xl">Reviews</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm-gray">
        Hide or unhide customer reviews. Only visible reviews are shown on the public site.
      </p>

      <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Filter reviews by status">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={tab === item.key}
            onClick={() => setTab(item.key)}
            className={
              tab === item.key
                ? "rounded-full bg-forest px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors"
                : "rounded-full border border-line bg-soft-white px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest/40"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-[8px] border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta-dark"
        >
          <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-6">
        {rows !== null && loadedTab === tab ? (
          rows.length === 0 ? (
            <p className="rounded-[8px] border border-line bg-soft-white px-6 py-10 text-center text-sm text-warm-gray">
              {tab === "all" ? "No reviews yet." : `No ${tab} reviews right now.`}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[8px] border border-line bg-soft-white">
            <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
              <thead className="border-b border-line bg-ivory-deep/50 text-[0.65rem] tracking-[0.16em] text-warm-gray uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Rating
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Review
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Received
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((review) => (
                  <tr key={review.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-medium text-forest">{review.name}</p>
                      <p className="mt-0.5 text-xs break-all text-warm-gray">
                        {review.email ?? "Email not provided"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StarRating rating={review.rating} size={13} />
                    </td>
                    <td className="max-w-md px-5 py-4 leading-relaxed text-charcoal">
                      {review.comment}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={review.status} label={statusLabels[review.status]} />
                    </td>
                    <td className="px-5 py-4 text-xs whitespace-nowrap text-warm-gray">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {actionProps(review).map((action) => (
                          <RowAction
                            key={action.key}
                            label={action.label}
                            icon={action.icon}
                            disabled={busyId === review.id}
                            onClick={() => void applyStatus(review, action.status)}
                          />
                        ))}
                        <RowAction
                          label={`Delete review from ${review.name}`}
                          icon={Trash}
                          disabled={busyId === review.id}
                          onClick={() => setConfirmTarget(review)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : error ? (
          <button
            type="button"
            onClick={() => void load(tab)}
            className="inline-flex items-center gap-2 rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <EyeOff size={14} aria-hidden="true" />
            Try again
          </button>
        ) : (
          <div className="flex justify-center py-16">
            <Spinner size={26} label="Loading reviews…" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Delete this review?"
        message={
          confirmTarget
            ? `The review from ${confirmTarget.name} will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={busyId !== null}
        onConfirm={() => {
          if (confirmTarget) void removeReview(confirmTarget);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
