import { useCallback, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { images, img } from "../../config/images";
import { cn } from "../../lib/cn";

/**
 * Draggable before/after comparison. Pointer drag on the image plus an
 * accessible range input for keyboard users.
 */
export function BeforeAfterSlider({
  beforeSrc = images.beforeAfter.before,
  afterSrc = images.beforeAfter.after,
  beforeLabel = "Before",
  afterLabel = "After",
  caption = "Illustrative repaint preview — project photography is published through the gallery.",
}: {
  beforeSrc?: string;
  afterSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
  caption?: string;
}) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setPosition(Math.min(Math.max(next, 2), 98));
  }, []);

  return (
    <figure className="w-full">
      <div
        ref={frameRef}
        className={cn(
          "relative aspect-[16/11] w-full overflow-hidden border border-line bg-sage select-none sm:aspect-[16/9]",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={(event) => {
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging) updateFromPointer(event.clientX);
        }}
        onPointerUp={(event) => {
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => setDragging(false)}
      >
        <img
          src={img(afterSrc, 1400)}
          alt={`After: ${afterLabel.toLowerCase()} view of the repainted space`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={img(beforeSrc, 1400)}
            alt={`Before: ${beforeLabel.toLowerCase()} view of the space`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>

        <span
          className="absolute top-0 bottom-0 w-px bg-ivory shadow-[0_0_18px_rgba(40,42,39,0.45)]"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/70 bg-forest text-ivory shadow-lift">
            <MoveHorizontal size={18} />
          </span>
        </span>

        <span className="absolute top-4 left-4 bg-charcoal/75 px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.2em] text-ivory uppercase">
          {beforeLabel}
        </span>
        <span className="absolute top-4 right-4 bg-terracotta px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.2em] text-white uppercase">
          {afterLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="range"
          min={2}
          max={98}
          step={1}
          value={Math.round(position)}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Drag to compare before and after"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-terracotta sm:max-w-xs"
        />
        <figcaption className="text-xs text-warm-gray">{caption}</figcaption>
      </div>
    </figure>
  );
}
