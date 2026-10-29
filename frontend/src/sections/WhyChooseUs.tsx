import { whyChooseItems } from "../data/content";
import { siteConfig } from "../config/site";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";

/** Forest-green strength statement section with warm ivory type. */
export function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-forest py-20 text-ivory sm:py-28">
      <span
        className="absolute top-0 right-0 h-56 w-56 border-t border-r border-ivory/10"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 left-0 h-40 w-40 border-b border-l border-ivory/10"
        aria-hidden="true"
      />

      <div className="page-container relative">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">Why choose us</span>
            <h2 className="display-heading mt-5 text-[2.1rem] leading-[1.1] text-ivory sm:text-[2.7rem]">
              The difference is in the preparation.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/70">
              A beautiful finish is the last step of a much longer process. These are the
              habits that shape every project we take on.
            </p>
            <div className="mt-9">
              <Button to={siteConfig.cta.to} variant="primary">
                Start Your Project
              </Button>
            </div>
          </Reveal>

          <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {whyChooseItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.id} delay={(index % 2) * 0.08}>
                  <div className="border-t border-ivory/20 pt-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-terracotta/70 text-terracotta">
                        <Icon size={17} strokeWidth={1.6} />
                      </span>
                      <span className="text-[0.65rem] font-semibold tracking-[0.26em] text-ivory/40 uppercase">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 font-serif text-xl text-ivory">{item.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-ivory/65">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
