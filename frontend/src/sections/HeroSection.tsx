import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { heroContent } from "../data/content";
import { images } from "../config/images";
import { Button } from "../components/ui/Button";
import { OptimizedImage } from "../components/ui/OptimizedImage";

const ease = [0.22, 1, 0.36, 1] as const;

/** Primary landing hero: editorial two-column composition. */
export function HeroSection() {
  const reduceMotion = useReducedMotion();

  const item = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease },
        };

  return (
    <section className="relative overflow-hidden pt-14 pb-20 sm:pt-16 lg:pt-20 lg:pb-28">
      <div className="page-container grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="relative z-10">
          <motion.span className="eyebrow" {...item(0.05)}>
            {heroContent.eyebrow}
          </motion.span>

          <motion.h1
            className="display-heading mt-6 text-[2.6rem] leading-[1.04] text-forest sm:text-[3.4rem] lg:text-[4.15rem]"
            {...item(0.14)}
          >
            Beautiful Spaces Begin With the{" "}
            <span className="relative inline-block italic text-terracotta">
              Right Paint
              <svg
                className="absolute -bottom-2 left-0 h-2 w-full text-terracotta/45"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 5.5C40 2 96 1.5 198 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </motion.h1>

          <motion.p className="mt-7 max-w-xl text-base leading-relaxed text-warm-gray sm:text-lg" {...item(0.24)}>
            {heroContent.description}
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap items-center gap-4" {...item(0.34)}>
            <Button to={heroContent.primaryCta.to} size="lg">
              {heroContent.primaryCta.label}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Button>
            <Button to={heroContent.secondaryCta.to} variant="outline" size="lg">
              {heroContent.secondaryCta.label}
            </Button>
          </motion.div>

          <motion.div className="mt-12 flex flex-wrap items-end gap-8 border-t border-line pt-7" {...item(0.44)}>
            <div>
              <span className="block text-[0.65rem] font-semibold tracking-[0.24em] text-warm-gray uppercase">
                Palette
              </span>
              <div className="mt-3 flex items-center gap-3">
                {heroContent.swatches.map((swatch) => (
                  <span key={swatch.hex} className="group relative block" title={swatch.name}>
                    <span
                      className="block h-8 w-8 rounded-full border border-black/5 shadow-[0_6px_14px_-8px_rgba(40,42,39,0.7)] transition-transform duration-300 group-hover:-translate-y-1"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="sr-only">{swatch.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <p className="max-w-[15rem] text-xs leading-relaxed tracking-wide text-warm-gray">
              Interior · Exterior · Residential · Commercial painting and decorative finishes.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="relative"
          initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease }}
        >
          <div className="absolute -top-4 -right-4 hidden h-28 w-28 border-t border-r border-terracotta/50 sm:block" aria-hidden="true" />
          <div className="relative">
            <div className="absolute -inset-3 border border-line sm:-inset-5" aria-hidden="true" />
            <OptimizedImage
              src={images.hero.main}
              alt="Freshly painted living room with a sage green feature wall and warm leather seating"
              aspect="aspect-[4/5] sm:aspect-[5/5] lg:aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 46vw"
              priority
              className="relative shadow-soft"
            />

            <div className="absolute -bottom-8 -left-4 hidden w-44 overflow-hidden border-4 border-ivory shadow-lift sm:block lg:-left-10 lg:w-52">
              <OptimizedImage
                src={images.hero.detail}
                alt="Paint roller applying a fresh coat of paint to a wall"
                aspect="aspect-[4/3]"
                sizes="220px"
              />
            </div>

            <motion.div
              className="absolute -top-6 left-4 hidden bg-forest px-5 py-3 text-ivory sm:block lg:-left-8"
              initial={reduceMotion ? undefined : { opacity: 0, x: -14 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease }}
            >
              <span className="text-[0.6rem] font-semibold tracking-[0.22em] text-terracotta uppercase">
                Palette
              </span>
              <span className="mt-1 block font-serif text-lg leading-tight">
                Colour &amp; finish guidance
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
