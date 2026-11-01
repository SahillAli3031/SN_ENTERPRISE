import { Check, Mail } from "lucide-react";
import { aboutContent } from "../data/content";
import { images } from "../config/images";
import { Button } from "../components/ui/Button";
import { OptimizedImage } from "../components/ui/OptimizedImage";
import { Reveal } from "../components/ui/Reveal";

interface AboutSectionProps {
  /** Flips the image/text order for alternating editorial layouts. */
  reverse?: boolean;
  /** Shows the full body copy (used on the About page). */
  expanded?: boolean;
}

/** Editorial split section introducing the company. */
export function AboutSection({ reverse = false, expanded = false }: AboutSectionProps) {
  const paragraphs = expanded ? aboutContent.paragraphs : aboutContent.paragraphs.slice(0, 2);

  return (
    <section className="py-20 sm:py-24">
      <div className="page-container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal from={reverse ? "right" : "left"} className={reverse ? "lg:order-2" : undefined}>
          <div className="relative overflow-hidden">
            <OptimizedImage
              src={images.about.primary}
              alt="Living room with sage green walls, rattan lighting and layered textiles"
              aspect="aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="shadow-soft"
            />
            <div className="absolute -right-3 -bottom-10 w-40 border-4 border-ivory shadow-lift sm:-right-6 sm:w-52 lg:-bottom-12">
              <OptimizedImage
                src={images.about.secondary}
                alt="Bright open-plan living space with a timber accent wall"
                aspect="aspect-[4/3]"
                sizes="220px"
              />
            </div>
            <span
              className="absolute -bottom-6 left-4 hidden h-20 w-20 border-b border-l border-terracotta/60 sm:block"
              aria-hidden="true"
            />
          </div>
        </Reveal>

        <div className={reverse ? "lg:order-1" : undefined}>
          <Reveal>
            <span className="eyebrow">{aboutContent.eyebrow}</span>
            <h2 className="display-heading mt-5 text-[2.1rem] leading-[1.12] text-forest sm:text-[2.7rem]">
              {aboutContent.title}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-charcoal sm:text-lg">
              {aboutContent.lead}
            </p>
          </Reveal>

          <div className="mt-6 space-y-4">
            {paragraphs.map((paragraph) => (
              <Reveal key={paragraph.slice(0, 24)}>
                <p className="text-[0.95rem] leading-relaxed text-warm-gray">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {aboutContent.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-charcoal">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <Reveal className="mt-10 flex flex-wrap gap-4">
            <Button to={aboutContent.cta.to} variant="secondary">
              {aboutContent.cta.label}
            </Button>
            <Button to={aboutContent.secondaryCta.to} variant="outline">
              <Mail size={15} />
              {aboutContent.secondaryCta.label}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
