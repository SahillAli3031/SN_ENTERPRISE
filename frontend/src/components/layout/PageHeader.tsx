import { Reveal } from "../ui/Reveal";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/** Shared header band for inner pages. */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="border-b border-line bg-ivory-deep/60 pt-14 pb-14 sm:pt-16 sm:pb-16">
      <div className="page-container">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-heading mt-5 max-w-3xl text-[2.4rem] leading-[1.06] text-forest sm:text-[3.2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-warm-gray sm:text-lg">
              {description}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
