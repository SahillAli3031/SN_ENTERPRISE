import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { siteConfig } from "../config/site";
import { Reveal } from "../components/ui/Reveal";

/** Closing call-to-action band used on inner pages. */
export function CtaBand({
  title = "Ready to refresh your space?",
  description = "Share a few details about your project and we will come back with clear next steps.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="bg-ivory-deep/70 py-16 sm:py-20">
      <div className="page-container">
        <Reveal className="flex flex-col items-start justify-between gap-8 border border-line bg-soft-white p-8 sm:p-12 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <span className="eyebrow">Get Started</span>
            <h2 className="display-heading mt-4 text-[1.8rem] leading-tight text-forest sm:text-[2.3rem]">
              {title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-warm-gray sm:text-base">{description}</p>
          </div>
          <Link
            to={siteConfig.cta.to}
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-terracotta px-8 py-4 text-[0.75rem] font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-terracotta-dark"
          >
            {siteConfig.cta.label}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
