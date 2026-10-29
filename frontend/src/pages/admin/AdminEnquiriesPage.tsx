import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Mail, Phone, Trash } from "lucide-react";
import { deleteEnquiry, fetchEnquiries, updateEnquiryStatus } from "../../api/enquiries";
import { getErrorMessage } from "../../api/client";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { Spinner } from "../../components/ui/Spinner";
import type { Enquiry, EnquiryStatus } from "../../types";

const statusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** /admin/enquiries — quote/contact intake with follow-up status changes. */
export function AdminEnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Enquiry | null>(null);

  const load = useCallback(async () => {
    try {
      const enquiries = await fetchEnquiries();
      setRows(enquiries);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn't load enquiries. Please try again."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (enquiry: Enquiry, status: EnquiryStatus) => {
    setBusyId(enquiry.id);
    setError(null);
    try {
      await updateEnquiryStatus(enquiry.id, status);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "That change could not be saved. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  const removeEnquiry = async (enquiry: Enquiry) => {
    setBusyId(enquiry.id);
    setError(null);
    try {
      await deleteEnquiry(enquiry.id);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "The enquiry could not be deleted. Please try again."));
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div>
      <span className="eyebrow">Follow up</span>
      <h1 className="display-heading mt-4 text-3xl text-forest sm:text-4xl">Enquiries</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm-gray">
        Quote and contact requests from the public site. Mark each one as you follow up.
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-[8px] border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta-dark"
        >
          <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-7">
        {rows === null ? (
          <div className="flex justify-center py-16">
            <Spinner size={26} label="Loading enquiries…" />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-[8px] border border-line bg-soft-white px-6 py-10 text-center text-sm text-warm-gray">
            No enquiries yet.
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
                    Contact
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Request
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Message
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Received
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((enquiry) => (
                  <tr key={enquiry.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-medium text-forest">{enquiry.fullName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="flex items-center gap-1.5 text-xs break-all text-forest underline-offset-4 hover:text-terracotta hover:underline"
                      >
                        <Mail size={12} aria-hidden="true" />
                        {enquiry.email}
                      </a>
                      <a
                        href={`tel:${enquiry.phone}`}
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-forest underline-offset-4 hover:text-terracotta hover:underline"
                      >
                        <Phone size={12} aria-hidden="true" />
                        {enquiry.phone}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-medium text-charcoal">{enquiry.serviceType}</p>
                      <p className="mt-1 text-xs text-warm-gray">{enquiry.propertyType}</p>
                    </td>
                    <td className="max-w-sm px-5 py-4 text-xs leading-relaxed text-charcoal">
                      {enquiry.message}
                    </td>
                    <td className="px-5 py-4">
                      <label className="sr-only" htmlFor={`enquiry-status-${enquiry.id}`}>
                        {`Status for ${enquiry.fullName}`}
                      </label>
                      <select
                        id={`enquiry-status-${enquiry.id}`}
                        value={enquiry.status}
                        disabled={busyId === enquiry.id}
                        onChange={(event) =>
                          void changeStatus(enquiry, event.target.value as EnquiryStatus)
                        }
                        className="rounded-[6px] border border-line bg-ivory px-3 py-2 text-xs text-charcoal focus:border-forest focus:outline-none disabled:opacity-60"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      <div className="mt-2">
                        <StatusBadge tone={enquiry.status} label={statusLabels[enquiry.status]} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs whitespace-nowrap text-warm-gray">
                      {formatDate(enquiry.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label={`Delete enquiry from ${enquiry.fullName}`}
                          disabled={busyId === enquiry.id}
                          onClick={() => setConfirmTarget(enquiry)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] text-terracotta-dark uppercase transition-colors hover:border-terracotta hover:bg-terracotta hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash size={13} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Delete this enquiry?"
        message={
          confirmTarget
            ? `The enquiry from ${confirmTarget.fullName} will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={busyId !== null}
        onConfirm={() => {
          if (confirmTarget) void removeEnquiry(confirmTarget);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
