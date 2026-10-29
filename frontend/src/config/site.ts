/**
 * Central brand + business configuration.
 * Everything a real company would replace (name, contact details, socials,
 * address) lives here so it never has to be hunted down inside components.
 */
export interface NavLink {
  label: string;
  to: string;
}

export const siteConfig = {
  name: "Verdant & Co.",
  fullName: "Verdant & Co. Painters",
  /** Short mark rendered inside the logo tile. */
  monogram: "VC",
  tagline: "Painters & Decorators",
  description:
    "Thoughtful interior and exterior painting, quality finishes and craftsmanship designed to transform your space.",
  /** Replace with the real domain once it exists. */
  url: "https://verdantandco.example",

  contact: {
    /** Display + href for the phone number. Leave empty to hide phone links. */
    phoneDisplay: "+1 (555) 000-0000",
    phoneHref: "tel:+15550000000",
    /** Placeholder address — replace with the real business address. */
    address: "128 Alder Street, Suite 4\nPortland, OR 97204",
    /** Placeholder mailbox (reserved .example TLD — clearly not a live inbox). */
    email: "hello@verdantandco.example",
    hours: "Monday – Saturday, 8:00 – 18:00",
    /**
     * WhatsApp business number in international format WITHOUT "+" or spaces,
     * e.g. "15551234567". Leave empty until a genuine business number exists —
     * the floating WhatsApp button stays hidden while this is empty.
     */
    whatsapp: "",
  },

  social: {
    /** Placeholder destinations — swap for the real profiles. */
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    linkedin: "https://www.linkedin.com/",
  },

  nav: [
    { label: "Home", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "Services", to: "/services" },
    { label: "Our Work", to: "/work" },
    { label: "Reviews", to: "/reviews" },
    { label: "Contact", to: "/contact" },
  ] satisfies NavLink[],

  legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms & Conditions", to: "/terms" },
  ] satisfies NavLink[],

  cta: { label: "Get a Free Quote", to: "/contact#quote" },
} as const;

export type SiteConfig = typeof siteConfig;
