import type { Business } from "@/lib/types/booking";
import { Globe, Mail, MapPin, Phone } from "lucide-react";

type BusinessContactProps = {
  business: Business;
  className?: string;
};

export function BusinessContact({ business, className }: BusinessContactProps) {
  const social = business.social_links ?? {};
  const address = [
    business.address_line1,
    business.city,
    business.state,
    business.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const hasContact =
    business.phone ||
    business.email ||
    business.website ||
    address ||
    social.instagram ||
    social.facebook ||
    social.tiktok ||
    social.youtube;

  if (!hasContact) return null;

  return (
    <footer className={className}>
      <div className="mx-auto flex max-w-2xl flex-wrap gap-x-4 gap-y-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
        {address && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {address}
          </span>
        )}
        {business.phone && (
          <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {business.phone}
          </a>
        )}
        {business.email && (
          <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {business.email}
          </a>
        )}
        {business.website && (
          <a
            href={business.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Website
          </a>
        )}
        {social.instagram && (
          <a href={social.instagram} target="_blank" rel="noreferrer" className="hover:text-foreground">
            Instagram
          </a>
        )}
        {social.facebook && (
          <a href={social.facebook} target="_blank" rel="noreferrer" className="hover:text-foreground">
            Facebook
          </a>
        )}
        {social.tiktok && (
          <a href={social.tiktok} target="_blank" rel="noreferrer" className="hover:text-foreground">
            TikTok
          </a>
        )}
        {social.youtube && (
          <a href={social.youtube} target="_blank" rel="noreferrer" className="hover:text-foreground">
            YouTube
          </a>
        )}
      </div>
    </footer>
  );
}
