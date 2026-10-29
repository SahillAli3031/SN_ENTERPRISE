/**
 * Single source of truth for every photograph used by the UI.
 *
 * Demo entries are Unsplash-hosted placeholders (verified reachable) that the
 * admin will replace through the gallery API. Components must import from this
 * file instead of hardcoding URLs.
 */
const UNSPLASH_HOST = "images.unsplash.com";

/** Base (width-less) Unsplash URL for a photo id. */
export function photo(photoId: string): string {
  return `https://${UNSPLASH_HOST}/photo-${photoId}`;
}

/**
 * Resolve an image source at a requested width.
 * Unsplash sources get responsive query params; API/uploaded URLs pass through.
 */
export function img(src: string, width: number): string {
  if (!src || !src.includes(UNSPLASH_HOST)) return src;
  const base = src.split("?")[0];
  return `${base}?auto=format&fit=crop&w=${width}&q=80`;
}

export const images = {
  hero: {
    main: photo("1554995207-c18c203602cb"),
    detail: photo("1562259949-e8e7689d7828"),
  },
  about: {
    primary: photo("1615529182904-14819c35db37"),
    secondary: photo("1600607687939-ce8a6c25118c"),
  },
  contact: {
    aside: photo("1600585152220-90363fe7e115"),
  },
  services: {
    interior: photo("1618221195710-dd6b41faaea6"),
    exterior: photo("1570129477492-45c003edd2be"),
    residential: photo("1600566753086-00f18fb6b3ea"),
    commercial: photo("1604328698692-f76ea9498e76"),
    decorative: photo("1558591710-4b4a1ae0f04d"),
    repaint: photo("1517581177682-a085bb7ffb15"),
  },
  beforeAfter: {
    before: photo("1513694203232-719a280e022f"),
    after: photo("1600210492486-724fe5c67fb0"),
  },
} as const;

export interface DemoGalleryEntry {
  title: string;
  category: "interior" | "exterior" | "commercial";
  /** Base URL (no query string) — resolved per breakpoint at render time. */
  imageUrl: string;
  alt: string;
}

/**
 * Placeholder portfolio used only when the gallery API is unavailable, so the
 * site still renders a complete portfolio during development.
 * Flagged as demo data and replaced by database records in production.
 */
export const demoGallery: DemoGalleryEntry[] = [
  {
    title: "Sunlit Living Room",
    category: "interior",
    imageUrl: photo("1600210492486-724fe5c67fb0"),
    alt: "Sunlit living room with warm neutral walls and leather sofa",
  },
  {
    title: "Classic Weatherboard Exterior",
    category: "exterior",
    imageUrl: photo("1570129477492-45c003edd2be"),
    alt: "Classic white weatherboard house with a freshly painted facade",
  },
  {
    title: "Warm Minimal Lounge",
    category: "interior",
    imageUrl: photo("1618221195710-dd6b41faaea6"),
    alt: "Warm minimal living room with soft grey painted walls",
  },
  {
    title: "Timber House at Dusk",
    category: "exterior",
    imageUrl: photo("1568605114967-8130f3a36994"),
    alt: "Timber clad house glowing at dusk after exterior refinishing",
  },
  {
    title: "White Oak Kitchen",
    category: "interior",
    imageUrl: photo("1600585152220-90363fe7e115"),
    alt: "Bright kitchen with white cabinetry and oak details",
  },
  {
    title: "Workspace Refresh",
    category: "commercial",
    imageUrl: photo("1497366754035-f200968a6e72"),
    alt: "Modern office corridor with freshly painted walls and glass partitions",
  },
  {
    title: "Garden Villa Exterior",
    category: "exterior",
    imageUrl: photo("1580587771525-78b9dba3b914"),
    alt: "Contemporary villa exterior with crisp white render",
  },
  {
    title: "Teal Accent Lounge",
    category: "interior",
    imageUrl: photo("1505691938895-1758d7feb511"),
    alt: "Living room with cream sofa and deep teal painted accents",
  },
  {
    title: "Studio Lounge",
    category: "commercial",
    imageUrl: photo("1524758631624-e2822e304c36"),
    alt: "Commercial studio lounge with light timber and painted walls",
  },
  {
    title: "Suburban Facade",
    category: "exterior",
    imageUrl: photo("1605276374104-dee2a0ed3cd6"),
    alt: "Suburban brick home with repainted trim and garage doors",
  },
  {
    title: "Classic Fireplace Room",
    category: "interior",
    imageUrl: photo("1560448204-e02f11c3d0e2"),
    alt: "Neutral living room with fireplace and soft painted walls",
  },
  {
    title: "Poolside Pavilion",
    category: "exterior",
    imageUrl: photo("1512917774080-9991f1c4c750"),
    alt: "Poolside pavilion with white rendered exterior walls",
  },
  {
    title: "Reading Corner",
    category: "interior",
    imageUrl: photo("1493809842364-78817add7ffb"),
    alt: "Reading corner with parquet floor and pale painted walls",
  },
  {
    title: "Dark Clad Residence",
    category: "exterior",
    imageUrl: photo("1600585154340-be6161a56a0c"),
    alt: "Dark clad modern residence with warm interior lighting",
  },
  {
    title: "Open Plan Renewal",
    category: "commercial",
    imageUrl: photo("1604328698692-f76ea9498e76"),
    alt: "Open plan workspace with green seating and freshly painted walls",
  },
];
