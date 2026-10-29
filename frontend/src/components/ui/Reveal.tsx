import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animation delay in seconds. */
  delay?: number;
  /** Direction the content drifts in from. */
  from?: "up" | "left" | "right" | "none";
  /** Once revealed, stay revealed (recommended for scroll sections). */
  once?: boolean;
}

/**
 * Scroll-triggered entrance animation that fully respects the user's
 * reduced-motion preference (content simply appears instead of animating).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const offset = {
    up: { y: 26, x: 0 },
    left: { y: 0, x: -26 },
    right: { y: 0, x: 26 },
    none: { y: 0, x: 0 },
  }[from];

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
