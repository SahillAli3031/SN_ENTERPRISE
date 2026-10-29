import { PageHeader } from "../components/layout/PageHeader";
import { CtaBand } from "../sections/CtaBand";
import { ReviewsSection } from "../sections/ReviewsSection";

export function ReviewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reviews"
        title="Feedback from the people we have worked with."
        description="Only reviews approved by our team are published. Submitted reviews are checked before they appear."
      />
      <ReviewsSection />
      <CtaBand
        title="Worked with us recently?"
        description="Share your experience — it helps other homeowners and businesses choose with confidence."
      />
    </>
  );
}
