import { useState } from "react";
import { cn } from "../../lib/cn";
import { img } from "../../config/images";

interface OptimizedImageProps {
  /** Base image source (Unsplash sources are resolved per breakpoint). */
  src: string;
  alt: string;
  className?: string;
  /** CSS aspect ratio class, e.g. "aspect-[4/3]". */
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  /** Extra widths offered in the srcSet for Unsplash sources. */
  widths?: number[];
}

/**
 * Lazy-loading image with responsive srcSet, graceful loading state and an
 * on-brand fallback panel if a source ever fails to load.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  aspect = "aspect-[4/3]",
  sizes = "(max-width: 640px) 100vw, 50vw",
  priority = false,
  widths = [480, 768, 1200, 1600],
}: OptimizedImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isResponsive = src.includes("images.unsplash.com");

  return (
    <div className={cn("relative overflow-hidden bg-sage", aspect, className)}>
      {failed ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-sage"
          aria-hidden="true"
        >
          <span className="font-serif text-sm tracking-[0.2em] text-forest/60 uppercase">
            S N Enterprise
          </span>
        </div>
      ) : (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-sage" aria-hidden="true" />}
          <img
            src={img(src, widths[Math.min(2, widths.length - 1)])}
            srcSet={
              isResponsive
                ? widths.map((w) => `${img(src, w)} ${w}w`).join(", ")
                : undefined
            }
            sizes={isResponsive ? sizes : undefined}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out",
              loaded ? "scale-100 opacity-100" : "scale-105 opacity-0",
            )}
          />
        </>
      )}
    </div>
  );
}
