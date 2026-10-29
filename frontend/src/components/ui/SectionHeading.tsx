import { cn } from "../../lib/cn";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}

/** Consistent editorial section header used across the site. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const isLight = tone === "light";

  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        isCenter && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "eyebrow",
            isCenter && "justify-center",
            isLight && "text-terracotta",
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "display-heading mt-5 text-[2rem] leading-[1.1] sm:text-[2.6rem] lg:text-[3rem]",
          isLight ? "text-ivory" : "text-forest",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-relaxed sm:text-lg",
            isCenter && "mx-auto",
            isLight ? "text-ivory/75" : "text-warm-gray",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
