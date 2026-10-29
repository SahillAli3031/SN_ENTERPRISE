import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { createEnquiry } from "../api/enquiries";
import { images } from "../config/images";
import { siteConfig } from "../config/site";
import { propertyOptions, serviceOptions } from "../data/content";
import { cn } from "../lib/cn";
import { OptimizedImage } from "../components/ui/OptimizedImage";
import { Reveal } from "../components/ui/Reveal";
import { Spinner } from "../components/ui/Spinner";

const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80, "Name is too long."),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\d][\d\s()-]{6,19}$/, "Please enter a valid phone number."),
  email: z.email("Please enter a valid email address."),
  serviceType: z.string().min(1, "Please choose the service you need."),
  propertyType: z.string().min(1, "Please choose your property type."),
  message: z
    .string()
    .trim()
    .min(10, "Please add a few details (at least 10 characters).")
    .max(1500, "Please keep your message under 1500 characters."),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

const fieldClasses =
  "w-full rounded-[6px] border border-line bg-ivory px-4 py-3 text-sm text-charcoal transition-colors placeholder:text-warm-gray/70 focus:border-forest focus:outline-none";

const labelClasses = "mb-2 block text-sm font-medium text-charcoal";

interface ContactSectionProps {
  /** Show the project photograph beside the form (About/Contact pages). */
  showImage?: boolean;
}

/** Contact + free quote form wired to the Express/MongoDB enquiry API. */
export function ContactSection({ showImage = true }: ContactSectionProps) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      serviceType: "",
      propertyType: "",
      message: "",
    },
    mode: "onTouched",
  });

  const requestedService = searchParams.get("service");

  useEffect(() => {
    if (requestedService && serviceOptions.includes(requestedService)) {
      setValue("serviceType", requestedService, { shouldValidate: true });
    }
  }, [requestedService, setValue]);

  const onSubmit = async (values: EnquiryFormValues) => {
    setStatus("loading");
    setMessage("");
    try {
      await createEnquiry(values);
      setStatus("success");
      setMessage(
        "Thank you — your enquiry has been sent. Our team will get back to you using the details you provided.",
      );
      reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Your enquiry could not be sent. Please try again.",
      );
    }
  };

  const whatsappNumber = siteConfig.contact.whatsapp.replace(/\D/g, "");

  return (
    <section id="quote" className="scroll-mt-24 border-t border-line bg-sage py-20 sm:py-24">
      <div className="page-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <Reveal>
            <span className="eyebrow">Free Quote</span>
            <h2 className="display-heading mt-5 text-[2.1rem] leading-[1.1] text-forest sm:text-[2.7rem]">
              Let's Transform Your Space.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-warm-gray">
              Tell us about the rooms, surfaces and timing you have in mind. We will come back
              with clear next steps and a straightforward quote.
            </p>
          </Reveal>

          <ul className="mt-9 space-y-5">
            {siteConfig.contact.phoneHref ? (
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-forest/20 bg-ivory text-forest">
                  <Phone size={16} strokeWidth={1.6} />
                </span>
                <div>
                  <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-warm-gray uppercase">
                    Call us
                  </span>
                  <a
                    href={siteConfig.contact.phoneHref}
                    className="font-serif text-lg text-forest transition-colors hover:text-terracotta"
                  >
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </div>
              </li>
            ) : null}
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-forest/20 bg-ivory text-forest">
                <Mail size={16} strokeWidth={1.6} />
              </span>
              <div>
                <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-warm-gray uppercase">
                  Email
                </span>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-serif text-lg break-all text-forest transition-colors hover:text-terracotta"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </li>
            {siteConfig.contact.address ? (
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-forest/20 bg-ivory text-forest">
                  <MapPin size={16} strokeWidth={1.6} />
                </span>
                <div>
                  <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-warm-gray uppercase">
                    Studio
                  </span>
                  <span className="whitespace-pre-line font-serif text-lg text-forest">
                    {siteConfig.contact.address}
                  </span>
                </div>
              </li>
            ) : null}
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-forest/20 bg-ivory text-forest">
                <Clock size={16} strokeWidth={1.6} />
              </span>
              <div>
                <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-warm-gray uppercase">
                  Hours
                </span>
                <span className="font-serif text-lg text-forest">{siteConfig.contact.hours}</span>
              </div>
            </li>
          </ul>

          {whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-forest/35 px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:bg-forest hover:text-ivory"
            >
              Message us on WhatsApp
            </a>
          ) : null}

          {showImage ? (
            <div className="mt-10 hidden lg:block">
              <OptimizedImage
                src={images.contact.aside}
                alt="Bright white kitchen with oak cabinetry after a fresh repaint"
                aspect="aspect-[16/10]"
                sizes="40vw"
                className="border border-line"
              />
            </div>
          ) : null}
        </div>

        <Reveal from="right">
          <div className="border border-line bg-soft-white p-6 shadow-soft sm:p-9">
            {status === "success" ? (
              <div className="flex h-full flex-col items-start justify-center rounded-[6px] border border-forest/25 bg-sage p-6 sm:p-8">
                <CircleCheck size={28} className="text-forest" />
                <h3 className="mt-4 font-serif text-2xl text-forest">Enquiry sent</h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-gray">{message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="mt-7 rounded-full bg-terracotta px-7 py-3 text-[0.72rem] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-terracotta-dark"
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="full-name" className={labelClasses}>
                      Full Name <span className="text-terracotta">*</span>
                    </label>
                    <input
                      id="full-name"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      className={cn(fieldClasses, errors.fullName && "border-terracotta")}
                      aria-invalid={!!errors.fullName}
                      {...register("fullName")}
                    />
                    {errors.fullName ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                        {errors.fullName.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClasses}>
                      Phone Number <span className="text-terracotta">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1 555 000 0000"
                      className={cn(fieldClasses, errors.phone && "border-terracotta")}
                      aria-invalid={!!errors.phone}
                      {...register("phone")}
                    />
                    {errors.phone ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                        {errors.phone.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={labelClasses}>
                    Email Address <span className="text-terracotta">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="jane@example.com"
                    className={cn(fieldClasses, errors.email && "border-terracotta")}
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="service-type" className={labelClasses}>
                      Service Type <span className="text-terracotta">*</span>
                    </label>
                    <select
                      id="service-type"
                      className={cn(fieldClasses, "appearance-none", errors.serviceType && "border-terracotta")}
                      aria-invalid={!!errors.serviceType}
                      {...register("serviceType")}
                    >
                      <option value="">Select a service</option>
                      {serviceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.serviceType ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                        {errors.serviceType.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="property-type" className={labelClasses}>
                      Property Type <span className="text-terracotta">*</span>
                    </label>
                    <select
                      id="property-type"
                      className={cn(fieldClasses, "appearance-none", errors.propertyType && "border-terracotta")}
                      aria-invalid={!!errors.propertyType}
                      {...register("propertyType")}
                    >
                      <option value="">Select a property</option>
                      {propertyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.propertyType ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                        {errors.propertyType.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className={labelClasses}>
                    Message <span className="text-terracotta">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Which rooms or surfaces would you like painted? Do you have colours or timing in mind?"
                    className={cn(fieldClasses, "resize-y", errors.message && "border-terracotta")}
                    aria-invalid={!!errors.message}
                    {...register("message")}
                  />
                  {errors.message ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                      {errors.message.message}
                    </p>
                  ) : null}
                </div>

                {status === "error" ? (
                  <div className="flex items-start gap-2.5 rounded-[6px] border border-terracotta/40 bg-terracotta/10 p-4">
                    <CircleAlert size={17} className="mt-0.5 shrink-0 text-terracotta-dark" />
                    <p className="text-sm text-terracotta-dark">{message}</p>
                  </div>
                ) : null}

                <div className="flex flex-col items-start gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-terracotta px-8 py-3.5 text-[0.75rem] font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {status === "loading" ? <Spinner size={17} /> : "Get a Free Quote"}
                  </button>
                  <p className="text-xs text-warm-gray">
                    Your details are used only to respond to this enquiry.
                  </p>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
