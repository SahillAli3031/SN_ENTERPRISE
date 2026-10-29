import { PageHeader } from "../components/layout/PageHeader";
import { ContactSection } from "../sections/ContactSection";

export function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's plan your painting project."
        description="Request a free quote or ask a question — the form below reaches our team directly."
      />
      <ContactSection />
    </>
  );
}
