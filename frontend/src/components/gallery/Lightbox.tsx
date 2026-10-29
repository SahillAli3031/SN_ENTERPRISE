import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGalleryStore } from "../../store/galleryStore";
import { img } from "../../config/images";

/** Full-screen keyboard-accessible lightbox for gallery items. */
export function Lightbox() {
  const reduceMotion = useReducedMotion();
  const items = useGalleryStore((state) => state.items);
  const index = useGalleryStore((state) => state.lightboxIndex);
  const close = useGalleryStore((state) => state.closeLightbox);
  const showNext = useGalleryStore((state) => state.showNext);
  const showPrev = useGalleryStore((state) => state.showPrev);

  const open = index !== null && items[index] !== undefined;
  const item = open ? items[index] : null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, showNext, showPrev]);

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-charcoal/92 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} — project preview`}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="truncate font-serif text-lg text-ivory sm:text-xl">{item.title}</p>
              <p className="mt-0.5 text-[0.65rem] font-semibold tracking-[0.22em] text-terracotta uppercase">
                {item.category} project
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums text-ivory/60">
                {(index ?? 0) + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close preview"
                autoFocus
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors hover:border-terracotta hover:bg-terracotta"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-4 sm:px-16">
            <button
              type="button"
              onClick={showPrev}
              aria-label="Previous project"
              className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30 bg-charcoal/60 text-ivory transition-colors hover:border-terracotta hover:bg-terracotta sm:left-4"
            >
              <ChevronLeft size={20} />
            </button>

            <motion.figure
              key={item.id}
              className="flex max-h-full min-w-0 flex-col items-center"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={img(item.imageUrl, 1600)}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
              <figcaption className="mt-4 max-w-2xl px-4 text-center text-sm text-ivory/70">
                {item.alt}
              </figcaption>
            </motion.figure>

            <button
              type="button"
              onClick={showNext}
              aria-label="Next project"
              className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30 bg-charcoal/60 text-ivory transition-colors hover:border-terracotta hover:bg-terracotta sm:right-4"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
