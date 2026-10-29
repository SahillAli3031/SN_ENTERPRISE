import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <section className="py-24 sm:py-32">
      <div className="page-container text-center">
        <span className="eyebrow justify-center">404</span>
        <h1 className="display-heading mt-6 text-[2.6rem] text-forest sm:text-[3.4rem]">
          This page has been painted over.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-warm-gray">
          The address you followed does not exist. Head back to the homepage or browse our
          services.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Button to="/">Back to Home</Button>
          <Button to="/services" variant="outline">
            View Services
          </Button>
        </div>
      </div>
    </section>
  );
}
