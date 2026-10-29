import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation modal used before every destructive admin action. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-charcoal/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 0.36, 0.35, 1] }}
            className="relative w-full max-w-md bg-soft-white p-6 shadow-lift outline-none sm:p-8"
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close dialog"
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-warm-gray transition-colors hover:border-forest hover:text-forest"
            >
              <X size={17} aria-hidden="true" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-terracotta" aria-hidden="true" />
              <div>
                <h2 id={titleId} className="display-heading text-xl text-forest">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">{message}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="rounded-full bg-terracotta px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
