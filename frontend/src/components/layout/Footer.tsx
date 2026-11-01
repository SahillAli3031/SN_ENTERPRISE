import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { siteConfig } from "../../config/site";
import { services } from "../../data/content";
import { BrandMark } from "./BrandMark";

function SocialIcon({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 text-ivory/80 transition-colors duration-300 hover:border-terracotta hover:bg-terracotta hover:text-white"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  );
}

const socials = [
  { key: "instagram", href: siteConfig.social.instagram, label: "Instagram", path: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5.01-4.74.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.6-.07 4.74s.01 3.5.07 4.74c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.05-1.15-.24-1.77-.4-2.18-.21-.55-.47-.94-.88-1.35-.41-.41-.8-.67-1.35-.88-.41-.16-1.03-.35-2.18-.4C15.5 4.01 15.14 4 12 4Zm0 3.06A4.94 4.94 0 1 0 12 16.94 4.94 4.94 0 0 0 12 7.06Zm0 1.8a3.14 3.14 0 1 1 0 6.28 3.14 3.14 0 0 1 0-6.28Zm5.14-.92a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z" },
  { key: "facebook", href: siteConfig.social.facebook, label: "Facebook", path: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.29-.04-1.3-.13-2.47-.13-2.44 0-4.11 1.49-4.11 4.23V9.9H7.4V13h2.72v8h3.38Z" },
  { key: "linkedin", href: siteConfig.social.linkedin, label: "LinkedIn", path: "M6.94 7.5A1.94 1.94 0 1 0 6.94 3.6a1.94 1.94 0 0 0 0 3.9ZM5.2 20.4h3.48V8.9H5.2v11.5Zm5.7-11.5h3.34v1.57h.05c.47-.88 1.6-1.81 3.3-1.81 3.53 0 4.18 2.32 4.18 5.34v6.4h-3.47v-5.67c0-1.35-.02-3.1-1.89-3.1-1.89 0-2.18 1.48-2.18 3v5.77H10.9V8.9Z" },
];

const year = new Date().getFullYear();

export function Footer() {

  return (
    <footer className="bg-forest text-ivory">
      <div className="page-container pt-16 pb-10 sm:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <BrandMark tone="light" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/70">
              {siteConfig.description}
            </p>
            <div className="mt-7 flex items-center gap-3">
              {socials.map((social) => (
                <SocialIcon key={social.key} href={social.href} label={social.label} path={social.path} />
              ))}
            </div>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-xs font-semibold tracking-[0.24em] text-terracotta uppercase">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {siteConfig.nav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-1 text-ivory/80 transition-colors hover:text-terracotta"
                  >
                    {item.label}
                    <ArrowUpRight size={13} className="opacity-0 transition-opacity hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <h3 className="text-xs font-semibold tracking-[0.24em] text-terracotta uppercase">
              Services
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    to={`/services#${service.id}`}
                    className="text-ivory/80 transition-colors hover:text-terracotta"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.24em] text-terracotta uppercase">
              Get in Touch
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-ivory/80">
              {siteConfig.contact.phoneHref ? (
                <li>
                  <a
                    href={siteConfig.contact.phoneHref}
                    className="flex items-start gap-3 transition-colors hover:text-terracotta"
                  >
                    <Phone size={15} className="mt-0.5 shrink-0" strokeWidth={1.6} />
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-start gap-3 break-all transition-colors hover:text-terracotta"
                >
                  <Mail size={15} className="mt-0.5 shrink-0" strokeWidth={1.6} />
                  {siteConfig.contact.email}
                </a>
              </li>
              {siteConfig.contact.address ? (
                <li className="flex items-start gap-3 whitespace-pre-line">
                  <MapPin size={15} className="mt-0.5 shrink-0" strokeWidth={1.6} />
                  <span className="break-all">{siteConfig.contact.address}</span>
                </li>
              ) : null}
            </ul>
            <Link
              to={siteConfig.cta.to}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-terracotta-dark"
            >
              {siteConfig.cta.label}
            </Link>
          </div>
        </div>

        <div className="mt-14 border-t border-ivory/15 pt-7">
          <div className="flex flex-col items-start justify-between gap-4 text-xs text-ivory/60 sm:flex-row sm:items-center">
            <p>
              © {year} {siteConfig.fullName}. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              {siteConfig.legal.map((item) => (
                <Link key={item.to} to={item.to} className="transition-colors hover:text-terracotta">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
