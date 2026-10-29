import { PageHeader } from "../components/layout/PageHeader";
import { CtaBand } from "../sections/CtaBand";
import { ProcessSection } from "../sections/ProcessSection";
import { ServicesSection } from "../sections/ServicesSection";

export function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Painting services for interiors, exteriors and everything between."
        description="Each service is delivered with the same process: assessment, careful preparation, specified materials and a tidy handover."
      />
      <ServicesSection
        heading={{
          eyebrow: "What We Offer",
          title: "Choose the service that fits the project.",
          description:
            "Not sure which one applies? Send us a note with a few details and we will point you in the right direction.",
        }}
        className="pt-16 sm:pt-20"
      />
      <ProcessSection />
      <CtaBand
        title="Need a service we have not listed?"
        description="Decorative work, touch-ups and multi-surface projects are welcome — describe it in your enquiry."
      />
    </>
  );
}
