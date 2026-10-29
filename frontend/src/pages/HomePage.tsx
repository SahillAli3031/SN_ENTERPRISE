import { AboutSection } from "../sections/AboutSection";
import { ContactSection } from "../sections/ContactSection";
import { GallerySection } from "../sections/GallerySection";
import { HeroSection } from "../sections/HeroSection";
import { ReviewsSection } from "../sections/ReviewsSection";
import { ServicesSection } from "../sections/ServicesSection";
import { TrustSection } from "../sections/TrustSection";
import { WhyChooseUs } from "../sections/WhyChooseUs";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <AboutSection />
      <ServicesSection />
      <GallerySection
        limit={6}
        showFilters={false}
        showBeforeAfter={false}
        heading={{
          eyebrow: "Our Work",
          title: "A glimpse of recent projects.",
          description:
            "Selected interior, exterior and commercial work — explore the full portfolio with filters, previews and full-screen viewing.",
        }}
        viewAllLink
      />
      <WhyChooseUs />
      <ReviewsSection limit={3} />
      <ContactSection />
    </>
  );
}
