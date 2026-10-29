import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "outline" | "light";
type Size = "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  to?: string;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-terracotta text-white hover:bg-terracotta-dark shadow-[0_10px_30px_-16px_rgba(200,117,82,0.9)]",
  secondary:
    "bg-forest text-ivory hover:bg-forest-dark shadow-[0_10px_30px_-18px_rgba(36,72,61,0.9)]",
  outline:
    "border border-forest/35 text-forest hover:border-forest hover:bg-forest hover:text-ivory",
  light:
    "border border-ivory/40 text-ivory hover:bg-ivory hover:text-forest",
};

const sizeClasses: Record<Size, string> = {
  md: "px-6 py-3 text-[0.8rem]",
  lg: "px-8 py-4 text-[0.85rem]",
};

/**
 * Shared button/link. Renders a router `Link`, an anchor, or a native button
 * depending on the props passed, keeping one consistent visual language.
 */
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  to,
  href,
  type = "button",
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  const reduceMotion = useReducedMotion();

  const classes = cn(
    "group inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.16em] transition-colors duration-300",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-terracotta",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const content = <span className="relative flex items-center gap-2">{children}</span>;

  const motionProps = reduceMotion
    ? {}
    : {
        whileTap: disabled ? undefined : { scale: 0.97 },
        transition: { duration: 0.2 },
      };

  if (to && !disabled) {
    return (
      <motion.div {...motionProps} className="inline-flex">
        <Link to={to} className={classes} onClick={onClick} {...rest}>
          {content}
        </Link>
      </motion.div>
    );
  }

  if (href && !disabled) {
    return (
      <motion.a
        {...motionProps}
        href={href}
        className={classes}
        onClick={onClick}
        rel="noopener noreferrer"
        {...rest}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      {...motionProps}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {content}
    </motion.button>
  );
}
