import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { siteConfig } from "../../config/site";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { BrandMark } from "./BrandMark";

/** Sticky, accessible navigation with a mobile overlay menu. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes (state adjusted during render).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  // Close the mobile menu when clicking outside of it.
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    },
    [menuOpen],
  );

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, handleClickOutside]);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative py-2 text-[0.9rem] font-medium tracking-wide transition-colors duration-300",
      "after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-terracotta after:transition-all after:duration-300 hover:after:w-full",
      isActive ? "text-terracotta after:w-full" : "text-forest hover:text-forest-dark",
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-ivory/95 backdrop-blur-md transition-shadow duration-300",
        scrolled ? "border-b border-line shadow-[0_10px_30px_-24px_rgba(36,72,61,0.55)]" : "border-b border-transparent",
      )}
    >
      <div className="page-container flex h-20 items-center justify-between gap-6">
        <BrandMark />

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {siteConfig.nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {siteConfig.contact.phoneHref ? (
            <a
              href={siteConfig.contact.phoneHref}
              className="hidden items-center gap-2 text-sm font-medium text-warm-gray transition-colors hover:text-forest xl:inline-flex"
            >
              <Phone size={15} strokeWidth={1.6} />
              {siteConfig.contact.phoneDisplay}
            </a>
          ) : null}
          <Button to={siteConfig.cta.to} size="md">
            {siteConfig.cta.label}
          </Button>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] border border-line bg-soft-white text-forest transition-colors hover:border-forest lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-20 max-h-[calc(100dvh-5rem)] overflow-y-auto overflow-x-hidden border-t border-line bg-ivory px-5 pt-6 pb-12 lg:hidden z-[100]"
          >
            <nav aria-label="Mobile" role="menu" className="flex flex-col divide-y divide-line">
              {siteConfig.nav.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between py-4 font-serif text-2xl transition-colors",
                        isActive ? "text-terracotta" : "text-forest",
                      )
                    }
                  >
                    {item.label}
                    <span className="text-xs font-sans tracking-[0.2em] text-warm-gray uppercase">
                      0{index + 1}
                    </span>
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-4">
              <Button to={siteConfig.cta.to} size="lg" className="w-full" onClick={() => setMenuOpen(false)}>
                {siteConfig.cta.label}
              </Button>
              {siteConfig.contact.phoneHref ? (
                <a
                  href={siteConfig.contact.phoneHref}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-warm-gray"
                >
                  <Phone size={15} strokeWidth={1.6} />
                  {siteConfig.contact.phoneDisplay}
                </a>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
