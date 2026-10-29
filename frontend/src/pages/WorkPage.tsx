import { PageHeader } from "../components/layout/PageHeader";
import { CtaBand } from "../sections/CtaBand";
import { GallerySection } from "../sections/GallerySection";

export function WorkPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Work"
        title="A portfolio of spaces we have refreshed."
        description="Filter by project type, open any image full screen, and drag the comparison slider to see the difference a repaint makes."
      />
      <GallerySection className="pt-16 sm:pt-20" />
      <CtaBand
        title="Want results like these?"
        description="Send through your room list, surfaces and preferred colours to get started."
      />
    </>
  );
}
