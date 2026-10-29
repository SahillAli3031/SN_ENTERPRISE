import { processSteps } from "../data/content";
import { Reveal } from "../components/ui/Reveal";
import { SectionHeading } from "../components/ui/SectionHeading";

/** Numbered four-step project process. */
export function ProcessSection() {
  return (
    <section className="border-y border-line bg-ivory-deep/60 py-20 sm:py-24">
      <div className="page-container">
        <SectionHeading
          eyebrow="How We Work"
          title="A straightforward path from first call to final coat."
          align="center"
          description="No surprises and no jargon — each stage is agreed before it begins."
        />

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <Reveal key={step.id} delay={index * 0.08}>
              <div className="relative h-full border-t border-forest/25 pt-6">
                <span className="font-serif text-4xl leading-none text-terracotta">{step.step}</span>
                <h3 className="mt-4 font-serif text-xl text-forest">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-gray">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
