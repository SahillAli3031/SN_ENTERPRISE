import { trustItems } from "../data/content";
import { Reveal } from "../components/ui/Reveal";

/** Refined benefits band presented on a Light Sage surface. */
export function TrustSection() {
  return (
    <section className="border-y border-line bg-sage py-16 sm:py-20">
      <div className="page-container">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">Why clients stay</span>
          <h2 className="display-heading mt-5 text-[1.9rem] text-forest sm:text-[2.3rem]">
            The standards we bring to every room.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal
                key={item.id}
                delay={index * 0.08}
                className={[
                  "relative lg:px-8",
                  index !== 0 ? "lg:border-l lg:border-forest/15" : "",
                  index === 0 ? "lg:pl-0" : "",
                  index === trustItems.length - 1 ? "lg:pr-0" : "",
                ].join(" ")}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[6px] border border-forest/20 bg-ivory text-forest">
                  <Icon size={21} strokeWidth={1.5} />
                </span>
                <h3 className="mt-6 font-serif text-xl text-forest">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-gray">{item.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
