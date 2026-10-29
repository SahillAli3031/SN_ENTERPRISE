import { PageHeader } from "../components/layout/PageHeader";
import { AboutSection } from "../sections/AboutSection";
import { CtaBand } from "../sections/CtaBand";
import { ProcessSection } from "../sections/ProcessSection";
import { WhyChooseUs } from "../sections/WhyChooseUs";

export function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="A painting company built on preparation and finish quality."
        description="Meet the people, standards and process behind every project we take on."
      />
      <AboutSection expanded />
      <ProcessSection />
      <AboutSection reverse expanded />
      <WhyChooseUs />
      <CtaBand
        title="Talk to us about your space"
        description="Tell us what you would like to refresh and we will help you plan the right approach."
      />
    </>
  );
}
