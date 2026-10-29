import { PageHeader } from "../components/layout/PageHeader";
import { siteConfig } from "../config/site";

/**
 * Starter privacy content. Replace with counsel-reviewed wording before
 * launch — it is intentionally generic and makes no regulatory claims.
 */
const sections = [
  {
    title: "Information we collect",
    body: `When you submit the contact or quote form we collect the details you provide: your name, phone number, email address, service and property type, and the message you write. When you submit a review we also store your name, email address, rating and comment.`,
  },
  {
    title: "How we use it",
    body: `Enquiry details are used only to respond to you about your project. Review emails are used to verify that a review comes from a real customer and are never published. We do not sell or rent your information to third parties.`,
  },
  {
    title: "Storage and retention",
    body: `Submitted information is stored in our database and kept only as long as needed to handle enquiries and maintain review records. You can ask us to remove your details at any time by contacting us.`,
  },
  {
    title: "Cookies and analytics",
    body: `This website does not set advertising cookies. If analytics are added later, this notice will be updated to describe them.`,
  },
  {
    title: "Contact",
    body: `Questions about this policy can be sent to ${siteConfig.contact.email}.`,
  },
];

export function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we handle the information you share with us through this website."
      />
      <section className="py-16 sm:py-20">
        <div className="page-container max-w-3xl space-y-10">
          <p className="border-l-2 border-terracotta pl-4 text-sm text-warm-gray">
            Template notice — replace this text with a policy reviewed by your legal advisor
            before publishing.
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
