import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Returns the page to the top on navigation and honours in-page anchors such
 * as `/contact#quote` or `/services#interior`.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        const timer = window.setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
        return () => window.clearTimeout(timer);
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
