import { Reveal } from "@/components/landing/reveal";
import { LOGO_CLOUD } from "@/lib/marketing/homepage";

export function LogoCloud() {
  const brands = [...LOGO_CLOUD, ...LOGO_CLOUD];

  return (
    <section
      className="marketing-hairline-b overflow-hidden px-0 py-14 md:py-16"
      aria-labelledby="logo-cloud-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p
            id="logo-cloud-heading"
            className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
          >
            Trusted by growing service brands
          </p>
        </Reveal>
      </div>

      <div className="relative mt-10 mask-[linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <ul className="marketing-marquee items-center" aria-hidden>
          {brands.map((brand, index) => (
            <li
              key={`${brand}-${index}`}
              className="shrink-0 text-lg font-semibold tracking-tight text-foreground/35 md:text-xl"
            >
              {brand}
            </li>
          ))}
        </ul>
        <ul className="sr-only">
          {LOGO_CLOUD.map((brand) => (
            <li key={brand}>{brand}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
