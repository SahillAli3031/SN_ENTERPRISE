import { useEffect } from "react";
import { ArrowRight, Info, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { galleryFilters } from "../data/content";
import { img } from "../config/images";
import { useGalleryStore, type GalleryFilter } from "../store/galleryStore";
import { cn } from "../lib/cn";
import { BeforeAfterSlider } from "../components/gallery/BeforeAfterSlider";
import { Lightbox } from "../components/gallery/Lightbox";
import { Reveal } from "../components/ui/Reveal";
import { SectionHeading } from "../components/ui/SectionHeading";

interface GallerySectionProps {
  heading?: { eyebrow: string; title: string; description?: string };
  showFilters?: boolean;
  showBeforeAfter?: boolean;
  /** Maximum number of projects to load (homepage teaser). */
  limit?: number;
  /** Renders a "View full portfolio" link under the grid. */
  viewAllLink?: boolean;
  className?: string;
}

/** Filterable portfolio grid with lightbox and optional before/after preview. */
export function GallerySection({
  heading,
  showFilters = true,
  showBeforeAfter = true,
  limit,
  viewAllLink = false,
  className,
}: GallerySectionProps) {
  const items = useGalleryStore((state) => state.items);
  const filter = useGalleryStore((state) => state.filter);
  const status = useGalleryStore((state) => state.status);
  const isDemo = useGalleryStore((state) => state.isDemo);
  const load = useGalleryStore((state) => state.load);
  const setFilter = useGalleryStore((state) => state.setFilter);
  const openLightbox = useGalleryStore((state) => state.openLightbox);

  useEffect(() => {
    void load("all", limit);
  }, [load, limit]);

  return (
    <section id="work" className={cn("py-20 sm:py-24", className)}>
      <div className="page-container">
        <div className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={heading?.eyebrow ?? "Our Work"}
            title={heading?.title ?? "Projects, room by room."}
            description={
              heading?.description ??
              "A selection of interior, exterior and commercial painting projects. Select any image to view it full screen."
            }
            className="max-w-2xl"
          />
          {showFilters ? (
            <Reveal delay={0.1}>
              <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter projects">
                {galleryFilters.map((option) => {
                  const active = filter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFilter(option.id as GalleryFilter)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-5 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-all duration-300",
                        active
                          ? "border-forest bg-forest text-ivory"
                          : "border-line bg-soft-white text-warm-gray hover:border-forest/40 hover:text-forest",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </Reveal>
          ) : null}
        </div>

        <div className="mt-10" aria-busy={status === "loading"}>
          {status === "loading" ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "animate-pulse bg-sage",
                    index === 0 ? "aspect-[16/11] lg:col-span-2" : "aspect-[4/3]",
                  )}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="border border-dashed border-line bg-soft-white px-6 py-16 text-center">
              <p className="font-serif text-2xl text-forest">Nothing published in this category yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-warm-gray">
                New projects are added regularly. Try another category or check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => {
                const featured = index === 0 && items.length > 2;
                return (
                  <Reveal
                    key={item.id}
                    delay={(index % 3) * 0.06}
                    className={cn(featured && "lg:col-span-2")}
                  >
                    <button
                      type="button"
                      onClick={() => openLightbox(index)}
                      aria-label={`Open ${item.title} in full screen`}
                      className="group relative block w-full overflow-hidden border border-line bg-sage text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      <img
                        src={img(item.imageUrl, featured ? 1200 : 768)}
                        srcSet={`${img(item.imageUrl, 480)} 480w, ${img(item.imageUrl, 768)} 768w, ${img(item.imageUrl, 1200)} 1200w`}
                        sizes={featured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]",
                          featured ? "aspect-[16/11]" : "aspect-[4/3]",
                        )}
                      />
                      <span className="absolute inset-0 bg-forest/0 transition-colors duration-500 group-hover:bg-forest/35" />
                      <span className="absolute top-4 left-4 bg-ivory/92 px-3 py-1.5 text-[0.58rem] font-semibold tracking-[0.2em] text-forest uppercase">
                        {item.category}
                      </span>
                      <span className="absolute inset-x-4 bottom-4 flex translate-y-3 items-end justify-between gap-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="font-serif text-lg leading-tight text-ivory drop-shadow">
                          {item.title}
                        </span>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta text-white">
                          <Maximize2 size={15} />
                        </span>
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          )}

          {isDemo && status === "success" ? (
            <p className="mt-6 flex items-start gap-2 text-xs text-warm-gray">
              <Info size={14} className="mt-0.5 shrink-0" />
              Sample project photography shown while the live gallery is being published by the
              administrator.
            </p>
          ) : null}

          {viewAllLink && status === "success" && items.length > 0 ? (
            <div className="mt-9 flex justify-center">
              <Link
                to="/work"
                className="group inline-flex items-center gap-2 border-b border-forest/30 pb-1 text-sm font-semibold tracking-wide text-forest transition-colors hover:border-terracotta hover:text-terracotta"
              >
                View the full portfolio
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ) : null}
        </div>

        {showBeforeAfter ? (
          <Reveal className="mt-16 border-t border-line pt-14">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">Before &amp; After</span>
                <h3 className="display-heading mt-4 text-2xl text-forest sm:text-3xl">
                  Drag to see the difference.
                </h3>
              </div>
            </div>
            <BeforeAfterSlider />
          </Reveal>
        ) : null}
      </div>

      <Lightbox />
    </section>
  );
}
