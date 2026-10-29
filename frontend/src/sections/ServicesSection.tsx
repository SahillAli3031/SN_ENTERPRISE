import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { services } from "../data/content";
import { img } from "../config/images";
import { cn } from "../lib/cn";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Reveal } from "../components/ui/Reveal";

interface ServicesSectionProps {
  /** Heading copy used on the dedicated Services page. */
  heading?: { eyebrow: string; title: string; description?: string };
  className?: string;
}

/** Painting service cards with restrained hover motion. */
export function ServicesSection({ heading, className }: ServicesSectionProps) {
  return (
    <section id="services" className={cn("py-20 sm:py-24", className)}>
      <div className="page-container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={heading?.eyebrow ?? "Painting Services"}
            title={heading?.title ?? "Services shaped around the space."}
            description={
              heading?.description ??
              "From a single room to a full exterior, each service follows the same process: careful preparation, specified materials and a tidy handover."
            }
          />
          <Reveal delay={0.1} className="hidden md:block">
            <Link
              to="/work"
              className="group inline-flex items-center gap-2 border-b border-forest/30 pb-1 text-sm font-semibold tracking-wide text-forest transition-colors hover:border-terracotta hover:text-terracotta"
            >
              View our work
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.id} delay={(index % 3) * 0.08}>
                <article
                  id={service.id}
                  className="group flex h-full flex-col overflow-hidden border border-line bg-soft-white transition-all duration-500 hover:-translate-y-1 hover:border-terracotta/60 hover:shadow-lift scroll-mt-28"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={img(service.image, 768)}
                      srcSet={`${img(service.image, 480)} 480w, ${img(service.image, 768)} 768w, ${img(service.image, 1200)} 1200w`}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                    />
                    <span className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-[6px] bg-ivory/95 text-forest shadow-[0_8px_20px_-14px_rgba(40,42,39,0.9)]">
                      <Icon size={18} strokeWidth={1.6} />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <h3 className="font-serif text-xl text-forest transition-colors group-hover:text-terracotta sm:text-[1.35rem]">
                      {service.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-warm-gray">
                      {service.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
                      <Link
                        to={`/contact?service=${encodeURIComponent(service.title)}#quote`}
                        className="text-[0.72rem] font-semibold tracking-[0.18em] text-terracotta uppercase transition-colors hover:text-terracotta-dark"
                      >
                        Get a Quote
                      </Link>
                      <Link
                        to={`/services#${service.id}`}
                        className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold tracking-[0.18em] text-forest uppercase transition-colors hover:text-terracotta"
                        aria-label={`Learn more about ${service.title}`}
                      >
                        Details
                        <ArrowRight
                          size={13}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
