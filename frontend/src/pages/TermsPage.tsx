import { PageHeader } from "../components/layout/PageHeader";
import { siteConfig } from "../config/site";

/**
 * Starter terms content. Replace with counsel-reviewed wording before launch.
 */
const sections = [
  {
    title: "About these terms",
    body: `These terms describe the basis on which ${siteConfig.fullName} provides information and quotes through this website. By submitting an enquiry you agree that we may contact you about your project.`,
  },
  {
    title: "Quotes and work",
    body: `Website enquiries do not form a contract. A project begins only once scope, price, timing and any special conditions have been agreed in writing between you and our team.`,
  },
  {
    title: "Site content",
    body: `We aim to keep the information on this site accurate and current, including services, colours and project imagery. Sample project photography may be shown before live project galleries are published.`,
  },
  {
    title: "Reviews",
    body: `Reviews submitted through the website are checked before publication. Reviews that contain abuse, spam or personal information may be withheld or removed.`,
  },
  {
    title: "Contact",
    body: `Questions about these terms can be sent to ${siteConfig.contact.email}.`,
  },
];

export function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        description="The ground rules for using this website and requesting a quote."
      />
      <section className="py-16 sm:py-20">
        <div className="page-container max-w-3xl space-y-10">
          <p className="border-l-2 border-terracotta pl-4 text-sm text-warm-gray">
            Template notice — replace this text with terms reviewed by your legal advisor before
            publishing.
          </p>
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="font-serif text-2xl text-forest">{section.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-charcoal">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
