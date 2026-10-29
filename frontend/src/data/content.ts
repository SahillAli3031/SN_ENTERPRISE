import {
  Award,
  Brush,
  Building,
  Check,
  Clock,
  Handshake,
  HardHat,
  House,
  Layers,
  MessageCircle,
  PaintRoller,
  Palette,
  Ruler,
  ShieldCheck,
  Sparkles,
  SprayCan,
  ThumbsUp,
} from "lucide-react";
import { images } from "../config/images";
import type { ServiceItem, TrustItem, WhyChooseItem } from "../types";

export const heroContent = {
  eyebrow: "Interior & Exterior Painting",
  title: "Beautiful Spaces Begin With the Right Paint.",
  description:
    "Bring your vision to life with thoughtful painting, quality finishes, and craftsmanship designed to transform your space.",
  primaryCta: { label: "Get a Free Quote", to: "/contact#quote" },
  secondaryCta: { label: "Explore Our Work", to: "/work" },
  swatches: [
    { name: "Forest Green", hex: "#24483D" },
    { name: "Terracotta", hex: "#C87552" },
    { name: "Light Sage", hex: "#E4E9E1" },
    { name: "Warm Ivory", hex: "#F7F3EB" },
  ],
};

export const trustItems: TrustItem[] = [
  {
    id: "workmanship",
    title: "Professional Workmanship",
    description:
      "Careful preparation and steady, experienced hands from first coat to final walkthrough.",
    icon: Award,
  },
  {
    id: "detail",
    title: "Attention to Detail",
    description:
      "Clean lines, protected surfaces and finishes that hold up to a close look.",
    icon: Ruler,
  },
  {
    id: "materials",
    title: "Quality Materials",
    description:
      "Paints and coatings selected for the surface, the setting and the finish you want.",
    icon: Palette,
  },
  {
    id: "communication",
    title: "Reliable Communication",
    description:
      "Clear timelines, straightforward updates and one point of contact throughout.",
    icon: MessageCircle,
  },
];

export const aboutContent = {
  eyebrow: "About Us",
  title: "Painting treated as a craft, not a chore.",
  lead: "We are a painting company built around preparation, patience and finish quality — the details that decide how a space feels long after the scaffolding is packed away.",
  paragraphs: [
    "Every project begins with understanding the space: how it is used, how light moves through it, and what the surface actually needs before a single coat is opened. From there we specify the right system for walls, trim, masonry or joinery and work through it methodically.",
    "Our team handles interiors, exteriors, residential homes and commercial spaces with the same standard — tidy work areas, respectful crews and a finish we are happy to stand behind.",
    "Colour decisions can feel daunting, so we are glad to guide them. Bring a reference, a fabric swatch or a single colour you love, and we will help you build a palette that suits the architecture and the light.",
  ],
  points: [
    "Surface assessment and honest recommendations",
    "Interior, exterior and specialist finishes",
    "Colour consultation and sample guidance",
    "Residential and commercial projects",
  ],
  cta: { label: "Learn More About Us", to: "/about" },
  secondaryCta: { label: "Contact Us", to: "/contact" },
};

export const services: ServiceItem[] = [
  {
    id: "interior",
    title: "Interior Painting",
    description:
      "Walls, ceilings, trim and joinery finished with careful prep, crisp edges and even coverage.",
    icon: Brush,
    image: images.services.interior,
  },
  {
    id: "exterior",
    title: "Exterior Painting",
    description:
      "Weather-ready coatings for render, timber and masonry, prepared properly for a lasting finish.",
    icon: House,
    image: images.services.exterior,
  },
  {
    id: "residential",
    title: "Residential Painting",
    description:
      "Whole homes and single rooms painted with respect for your furniture, routine and finishes.",
    icon: Sparkles,
    image: images.services.residential,
  },
  {
    id: "commercial",
    title: "Commercial Painting",
    description:
      "Offices, retail and shared spaces scheduled around your business to keep disruption low.",
    icon: Building,
    image: images.services.commercial,
  },
  {
    id: "decorative",
    title: "Decorative Wall Finishes",
    description:
      "Textured coatings, limewash and feature walls that give a room depth and character.",
    icon: SprayCan,
    image: images.services.decorative,
  },
  {
    id: "repaint",
    title: "Repainting & Renovation",
    description:
      "Refresh tired surfaces or tie a renovation together with a coordinated repaint.",
    icon: PaintRoller,
    image: images.services.repaint,
  },
];

export const whyChooseItems: WhyChooseItem[] = [
  {
    id: "professionals",
    title: "Skilled Painting Professionals",
    description: "Experienced painters who take ownership of the work and the workspace.",
    icon: HardHat,
  },
  {
    id: "preparation",
    title: "Careful Surface Preparation",
    description: "Cleaning, sanding, filling and priming before any topcoat goes on.",
    icon: Layers,
  },
  {
    id: "finishes",
    title: "Quality Paint and Finishes",
    description: "Specified products chosen for durability, coverage and the look you want.",
    icon: Palette,
  },
  {
    id: "clean",
    title: "Clean and Organised Work",
    description: "Protected floors and furniture, tidy stations and a swept site each day.",
    icon: ShieldCheck,
  },
  {
    id: "communication",
    title: "Transparent Communication",
    description: "Realistic timelines, clear scope and updates at every stage of the job.",
    icon: Clock,
  },
  {
    id: "customer",
    title: "Customer-Focused Service",
    description: "A finish you are happy with is the measure of a job done properly.",
    icon: ThumbsUp,
  },
];

export const processSteps = [
  { id: "enquire", step: "01", title: "Tell Us About the Space", description: "Share the rooms, surfaces and timing you have in mind through the quote form." },
  { id: "assess", step: "02", title: "Assessment & Colour", description: "We review the surfaces, discuss finishes and help refine the colour direction." },
  { id: "prepare", step: "03", title: "Preparation", description: "Protection, repairs, sanding and priming so the paint has the best foundation." },
  { id: "finish", step: "04", title: "Coats & Handover", description: "Even coats, crisp details, thorough clean-up and a final walkthrough together." },
];

export const serviceOptions = services.map((service) => service.title);

export const propertyOptions = [
  "House / Villa",
  "Apartment / Flat",
  "Townhouse",
  "Office / Workspace",
  "Retail / Hospitality",
  "Other",
];

export const galleryFilters = [
  { id: "all", label: "All Projects" },
  { id: "interior", label: "Interior" },
  { id: "exterior", label: "Exterior" },
  { id: "commercial", label: "Commercial" },
] as const;

export const icons = { Check, Handshake };
