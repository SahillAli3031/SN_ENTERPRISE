import { Link } from "react-router-dom";
import { siteConfig } from "../../config/site";
import { cn } from "../../lib/cn";

interface BrandMarkProps {
  className?: string;
  /** Renders the dark footer variant. */
  tone?: "dark" | "light";
}

/** Text-based brand mark: monogram tile + serif wordmark. */
export function BrandMark({ className, tone = "dark" }: BrandMarkProps) {
  return (
    <Link
      to="/"
      className={cn("group flex items-center gap-3", className)}
      aria-label={`${siteConfig.fullName} — home`}
    >
      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] transition-colors duration-300",
          tone === "dark"
            ? "bg-forest text-ivory group-hover:bg-terracotta"
            : "bg-ivory text-forest group-hover:bg-terracotta group-hover:text-white",
        )}
      >
        <span className="font-serif text-lg leading-none tracking-tight">{siteConfig.monogram}</span>
        <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full bg-terracotta transition-colors group-hover:bg-forest" />
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-serif text-lg tracking-tight sm:text-xl",
            tone === "dark" ? "text-forest" : "text-ivory",
          )}
        >
          {siteConfig.name}
        </span>
        <span
          className={cn(
            "text-[0.6rem] font-semibold tracking-[0.28em] uppercase",
            tone === "dark" ? "text-warm-gray" : "text-ivory/60",
          )}
        >
          {siteConfig.tagline}
        </span>
      </span>
    </Link>
  );
}
